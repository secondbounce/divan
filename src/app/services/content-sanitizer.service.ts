import { Injectable } from '@angular/core';

const TAB_WIDTH_IN_SPACES: number = 4;

@Injectable({
  providedIn: 'root'
})
export class ContentSanitizerService {
  public plaintextToHtml(plaintext: string, preserveIndents: boolean = false): string {
    let escaped: string = this.encodePlaintextForHtml(plaintext)
                              .replace(/\r\n?|\n/g, '<br>');
    if (preserveIndents) {
      escaped = escaped.replace('\t', '&nbsp;'.repeat(TAB_WIDTH_IN_SPACES));

      const matches: RegExpMatchArray | null = escaped.match(/ {2,}/g);
      if (matches) {
        for (const match of matches) {
          escaped = escaped.replace(match, '&nbsp;'.repeat(match.length - 1) + ' ');
        }
      }
    }

    return escaped;
  }

  public encodePlaintextForHtml(plaintext: string): string {
    /* Escaping according to OWASP recommendations:
        https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#rule-1---html-escape-before-inserting-untrusted-data-into-html-element-content

      As noted in that cheatsheet, '&apos;' not recommended because it's not in the HTML spec (See section
      24.4.1) - it's in the XML and XHTML specs.  Also, forward slash is included as it helps end an HTML entity.
    */
    return plaintext.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/\//g, '&#x2F;');
  }
}
