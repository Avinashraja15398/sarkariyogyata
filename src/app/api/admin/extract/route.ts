import { NextResponse } from 'next/server';
import { getStaff } from '@/lib/admin';

// SSRF guard: sirf public http(s) sites; localhost / private IP / cloud-metadata block
function isSafePublicUrl(u: string): boolean {
  try {
    const x = new URL(u);
    if (!['http:', 'https:'].includes(x.protocol)) return false;
    const h = x.hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || h === '0.0.0.0' || h === '::1' || h.startsWith('[')) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
    return true;
  } catch { return false; }
}

export async function POST(req: Request) {
  // Pehle ye route bina login ke open tha (koi bhi isse server se URL fetch karwa sakta tha)
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: 'Login required (admin/editor only).' }, { status: 401 });
  try {
    const { url, rawContent } = await req.json();
    let rawHtmlOrText = rawContent || '';

    // 1. Fetch HTML if URL is provided (Allowed to fetch from any source page, but we sanitize the output)
    if (!rawHtmlOrText && url && isSafePublicUrl(url)) {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(12000),
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        });
        if (res.ok) {
          rawHtmlOrText = await res.text();
        }
      } catch (e: any) {
        // Fallback
      }
    }

    if (!rawHtmlOrText.trim()) {
      return NextResponse.json({ error: 'URL ya text data zaroori hai.' }, { status: 400 });
    }

    // Strict URL Sanitizer: Blocks third-party aggregator links from final data and enforces official govt/department link
    const sanitizeUrl = (link: string | null | undefined, departmentFallback: string = 'https://sarkariyogyata.com') => {
      if (!link) return departmentFallback;
      const lower = link.toLowerCase();
      if (
        lower.includes('sarkariresult.com') ||
        lower.includes('freejobalert.com') ||
        lower.includes('jagranjosh.com') ||
        lower.includes('indiatimes.com')
      ) {
        return departmentFallback;
      }
      return link;
    };

    // 2. Extract Real Department Links from HTML Table Rows
    let applyOnlineUrl = '';
    let notificationPdfUrl = '';
    let officialWebsiteUrl = '';
    let admitCardUrl = '';
    let resultUrl = '';

    const trBlocks = rawHtmlOrText.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    for (const row of trBlocks) {
      const linkMatch = row.match(/href=["'](https?:\/\/[^"']+)["']/i);
      if (!linkMatch) continue;
      const href = linkMatch[1];

      if (/Apply\s*Online/i.test(row) && !applyOnlineUrl) {
        applyOnlineUrl = sanitizeUrl(href, '');
      } else if (/Download\s*Notification|Official\s*Notification/i.test(row) && !notificationPdfUrl) {
        notificationPdfUrl = sanitizeUrl(href, '');
      } else if (/Official\s*Website/i.test(row) && !officialWebsiteUrl) {
        officialWebsiteUrl = sanitizeUrl(href, '');
      } else if (/Download\s*Admit\s*Card/i.test(row) && !admitCardUrl) {
        admitCardUrl = sanitizeUrl(href, '');
      } else if (/Download\s*Result/i.test(row) && !resultUrl) {
        resultUrl = sanitizeUrl(href, '');
      }
    }

    // Extract <title>
    const htmlTitleMatch = rawHtmlOrText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let pageHtmlTitle = htmlTitleMatch
      ? htmlTitleMatch[1].replace(/<[^>]+>/g, '').replace(/(?:Sarkari\s*Result|FreeJobAlert)[®\s\-\|]*/gi, '').trim()
      : '';

    // 3. Convert Raw HTML to Clean Plain Text
    let cleanText = rawHtmlOrText
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<\/(tr|p|div|li|h1|h2|h3|h4)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(td|th|b|strong|span|a|font)>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&#8377;/g, '₹')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    cleanText = cleanText
      .replace(/Sarkari\s*Result[®]*/gi, 'SarkariYogyata')
      .replace(/www\.sarkariresult\.com/gi, 'sarkariyogyata.com');

    // 4. Title Extraction
    const postNameMatch =
      cleanText.match(/Name\s*of\s*Post\s*:\s*([^\n\r]+)/i) ||
      cleanText.match(/Post\s*Name\s*:\s*([^\n\r]+)/i);

    let rawTitle = postNameMatch ? postNameMatch[1].trim() : pageHtmlTitle;
    if (!rawTitle || rawTitle.toLowerCase().includes('doctype') || rawTitle.length < 5) {
      const lines = cleanText
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 10 && !(/www\.|since\s*2012|short\s*details/i.test(l) || /\([A-Za-z]{2,12}\)\s*$/.test(l)));
      rawTitle = lines[0] || 'Govt Recruitment 2026';
    }
    rawTitle = rawTitle.replace(/SarkariYogyata[®\s\-\|]*/gi, '').replace(/\s*:\s+/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // 5. Organization Detection - poore page ke menu/footer se nahi, sirf header line aur title se
    const SITES: Record<string, string> = {
      SCI: 'https://www.sci.gov.in', UIIC: 'https://uiic.co.in', RRB: 'https://www.rrbcdg.gov.in',
      MPESB: 'https://esb.mp.gov.in', SSC: 'https://ssc.gov.in', UPSC: 'https://upsc.gov.in',
    };
    let organization = 'Government Department';
    let defaultGovtWebsite = 'https://www.india.gov.in';

    const headText = cleanText.slice(0, 2500);
    const orgLine = headText.match(/^([A-Z][A-Za-z&.,'\- ]{6,110}?)\s*\(([A-Za-z]{2,12})\)\s*$/m);
    if (orgLine) {
      organization = `${orgLine[1].trim()} (${orgLine[2].toUpperCase()})`;
      defaultGovtWebsite = SITES[orgLine[2].toUpperCase()] || defaultGovtWebsite;
    } else {
      const known = rawTitle.match(/\b(SCI|UIIC|RRB|MPESB|SSC|UPSC)\b/i);
      if (known) {
        const k = known[1].toUpperCase();
        organization = k;
        defaultGovtWebsite = SITES[k];
      } else {
        const orgCandidate = rawTitle.split(/Recruitment|Online Form|Exam|Admit Card|Result|202[0-9]/i)[0].trim();
        if (orgCandidate.length > 3) organization = orgCandidate;
      }
    }

    // 6. Date Parser
    const extractDate = (pattern: RegExp) => {
      const m = cleanText.match(pattern);
      if (!m) return null;
      const parts = m[1].trim().split(/[\/\-\.]/);
      if (parts.length === 3) {
        let [d, mo, y] = parts;
        if (y.length === 2) y = '20' + y;
        return `${y.trim()}-${mo.trim().padStart(2, '0')}-${d.trim().padStart(2, '0')}`;
      }
      return null;
    };

    const appStart = extractDate(/Application\s*Begin\s*:\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i);
    const appEnd = extractDate(
      /Last\s*Date\s*(?:for\s*(?:Apply|Registration|Online)(?:\s*Online)?)?\s*:\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i
    );
    const feeEnd =
      extractDate(
        /(?:Pay\s*Exam\s*Fee\s*Last\s*Date|Last\s*Date\s*Pay\s*Exam\s*Fee)\s*:\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i
      ) || appEnd;
    const ageCutoff =
      extractDate(/Age\s*Limit\s*as\s*on\s*:?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i) || appEnd;

    // 7. Age & Posts
    const minAgeMatch = cleanText.match(/Minimum\s*Age\s*:\s*([0-9\.]+)\s*Years?/i);
    const maxAgeMatch = cleanText.match(/Maximum\s*Age\s*:\s*([0-9\.]+)\s*Years?/i);
    const minAge = minAgeMatch ? parseFloat(minAgeMatch[1]) : null;
    const maxAge = maxAgeMatch ? parseFloat(maxAgeMatch[1]) : null;

    const postMatch =
      cleanText.match(/Total\s*(?:Vacancy|Post|Posts)?\s*:\s*([0-9]+)\s*(?:Post|Posts)?/i) ||
      cleanText.match(/Total\s*Post\s*[:\s]*([0-9]+)/i);
    const totalPosts = postMatch ? parseInt(postMatch[1], 10) : null;

    // 8. Fees
    const money = (re: RegExp) => { const m = cleanText.match(re); return m ? parseInt(m[1], 10) : null; };
    const R = String.raw`(?:Rs\.?\s*|₹\s*)?`;
    const genFee = money(new RegExp(String.raw`General(?:\s*\/\s*(?:OBC|EWS|UR|BC|EBC))*\s*:\s*` + R + String.raw`(\d+)`, 'i'));
    const scFee = money(new RegExp(String.raw`(?:OBC\s*\/\s*)?SC\s*\/\s*ST(?:\s*\/\s*(?:PH|PwD|Divyang))*\s*:\s*` + R + String.raw`(\d+)`, 'i'));
    const phFee = money(new RegExp(String.raw`\bPH\b\s*(?:\([^)]*\))?\s*:\s*` + R + String.raw`(\d+)`, 'i'));
    const femaleFee = money(new RegExp(String.raw`(?:Female|Women)[^:\n]{0,30}:\s*` + R + String.raw`(\d+)`, 'i'));
    const feeText = genFee != null
      ? [`General / OBC / EWS: ₹${genFee}/-`, scFee != null ? `SC / ST: ₹${scFee}/-` : '', phFee != null ? `PH: ₹${phFee}/-` : '', femaleFee != null ? `Female: ₹${femaleFee}/-` : '']
          .filter(Boolean).join(' | ')
      : '';

    // Exam date + qualification (text se; qualification ko verify karna zaroori hai)
    const examM = cleanText.match(/Exam\s*Date\s*:\s*([^\n]{3,60})/i);
    const examDateText = examM && !/as per|before exam|available/i.test(examM[1]) ? examM[1].trim() : '';
    const qualM = cleanText.match(/\n([^\n]{0,60}(?:Bachelor|Graduat|Post\s*Graduate|Master|Diploma|Intermediate|12th|10th|Matric|\bITI\b|B\.?\s?Ed|D\.?\s?El\.?\s?Ed|DELED)[^\n]{0,180})/i);
    const qualification = qualM ? qualM[1].trim().slice(0, 220) : '';

    // District-wise posts (Anganwadi, Police etc.): har district ki alag last date hoti hai
    const districtWise = /(?:Last\s*Date[^\n:]*|Application\s*Begin)\s*:\s*District\s*Wise/i.test(cleanText);
    let districtText = '';
    let districtCount = 0;
    if (districtWise) {
      const si = cleanText.search(/District\s*Wise\s*Vacancy/i);
      const ei = cleanText.search(/How\s*to\s*Fill|Some\s*Useful|Important\s*Links/i);
      if (si >= 0) {
        const sec = cleanText.slice(si, ei > si ? ei : undefined)
          .replace(/District\s*Wise\s*Vacancy\s*Details/gi, ' ')
          .replace(/District\s*Name|Total\s*Vacancy|Village\s*\/\s*Ward\s*Wise\s*Vacancy\s*Details|\bLast\s*Date\b/gi, ' ')
          .replace(/UP\s+[A-Za-z ()]+?Online\s*Form\s*\d{4}/gi, ' ')
          .replace(/\s+/g, ' ');
        const rowRe = /([A-Z][A-Za-z()'.\- ]{2,35}?)\s+(\d{1,5})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})(\s*Date\s*Extended)?/g;
        const rows: string[] = [];
        let total = 0, m: RegExpExecArray | null;
        while ((m = rowRe.exec(sec))) {
          rows.push(`${m[1].trim()}: ${Number(m[2])} पद | अंतिम तिथि ${m[3].padStart(2, '0')}-${m[4].padStart(2, '0')}-${m[5]}${m[6] ? ' (Date Extended)' : ''}`);
          total += Number(m[2]);
        }
        districtCount = rows.length;
        if (rows.length) {
          districtText = `\n\nजिलेवार विवरण (District Wise) — ${rows.length} जिले, कुल ${total} पद:\n` + rows.map((r) => '• ' + r).join('\n') +
            '\n\nनोट: हर जिले की आवेदन तिथि अलग है। अपने जिले की सही तिथि के लिए आधिकारिक नोटिफिकेशन देखें।';
        } else {
          districtText = '\n\nयह भर्ती जिलेवार (District Wise) है - हर जिले की आवेदन तिथि अलग है। अपने जिले की तिथि आधिकारिक नोटिफिकेशन में देखें।';
        }
      }
    }

    const slug = rawTitle
      .replace(/[:\-–]?\s*apply\s*online(\s*form)?(\s*for\s*\d+\s*posts?)?/gi, ' ')
      .replace(/\s*:\s*/g, ' ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);

    const finalOfficialSite = sanitizeUrl(officialWebsiteUrl, defaultGovtWebsite);
    const finalApplyUrl = sanitizeUrl(applyOnlineUrl, finalOfficialSite);
    const finalPdfUrl = sanitizeUrl(notificationPdfUrl, finalOfficialSite);

    const structuredJob = {
      slug: slug || `job-${Date.now()}`,
      title: rawTitle,
      short_title: rawTitle.slice(0, 50),
      organization,
      category: 'Govt',
      job_type: /admit\s*card|hall\s*ticket/i.test(rawTitle) ? 'Admit Card' : /result|cut\s*off|merit\s*list/i.test(rawTitle) ? 'Result' : 'Latest Jobs',
      total_posts: totalPosts,
      full_description: `${organization} has released official notification for ${rawTitle}. Eligible candidates can check details and apply online on SarkariYogyata.` + districtText,
      application_start: appStart || null,
      last_date: appEnd || null,
      fee_last_date: feeEnd || appEnd || null,
      exam_date: examDateText || 'As Per Official Schedule',
      admit_card_date: 'Before Exam',
      age_as_on: ageCutoff || null,
      min_age: minAge,
      max_age: maxAge,
      age_limit: minAge != null && maxAge != null ? `${minAge} to ${maxAge} Years` : '',
      fee_gen_obc_ews: genFee,
      fee_sc_st_ph: scFee,
      fee_female: femaleFee,
      application_fee: feeText,
      min_qualification: qualification,
      eligibility_summary: qualification,
      source_url: 'https://sarkariyogyata.com',
      official_website: finalOfficialSite,
      apply_online_url: finalApplyUrl,
      notification_pdf_url: finalPdfUrl,
      admit_card_url: sanitizeUrl(admitCardUrl, ''),
      result_url: sanitizeUrl(resultUrl, ''),
      district_wise: districtWise,
      status: 'published',
      verified: true,
    };

    // Jo cheez page se nahi mili uska warning - guess/fake value ab kabhi nahi lagti
    const warnings: string[] = [];
    if (!appEnd && !districtWise) warnings.push('last_date nahi mili');
    if (!appStart && !districtWise) warnings.push('application_start nahi mili');
    if (districtWise) warnings.push(districtCount ? `District Wise post: ${districtCount} districts ki dates description me daal di gayi hain - baaki districts jodein/verify karein` : 'District Wise post: jila-wise table parse nahi hui - description me haath se likhein');
    if (totalPosts == null) warnings.push('total_posts nahi mile');
    if (minAge == null || maxAge == null) warnings.push('age limit nahi mili');
    if (genFee == null || scFee == null) warnings.push('fee nahi mili');
    warnings.push(qualification ? 'qualification page text se uthayi gayi hai - notification se verify karein' : 'min_qualification khali hai - official notification se bharein');
    if (!officialWebsiteUrl) warnings.push('official website link nahi mila (default lagaya) - check karein');
    if (organization === 'Government Department') warnings.push('organization detect nahi hua');

    return NextResponse.json({ success: true, data: structuredJob, warnings });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Extraction failed' }, { status: 500 });
  }
}