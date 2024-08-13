import { injectable } from 'inversify';
import fetch from 'node-fetch';
import { parse } from 'node-html-parser';

interface Game {
  day: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  location: string;
}

@injectable()
export class NuLigaFacade {
  public async fetchStuff() {
    const games: Game[] = [];

    const response = await fetch(
      'https://bhv-handball.liga.nu/cgi-bin/WebObjects/nuLigaHBDE.woa/wa/teamPortrait?teamtable=1977635&pageState=vorrunde&championship=AV+2024%2F25&group=378716'
    );
    const body = await response.text();
    const root = parse(body);

    const childNodes = root.querySelector('#content-row2')?.querySelector('table')?.querySelectorAll('tr');

    if (childNodes) {
      for (const childNode of childNodes) {
        const trimmed = childNode.text
          .trim()
          .replaceAll('\n', '*')
          .replaceAll('\t', '*')
          .replaceAll('\r', '')
          .replaceAll(/\s{2,}/g, '');
        const rowEntries = trimmed.split(/[*]+/g);
        if (rowEntries.length < 7) {
          console.table(rowEntries);
          continue;
        }
        const date = new Date(`${rowEntries[1].split('.').reverse().join('-')}T${rowEntries[2]}`).toISOString();
        games.push({
          day: rowEntries[0],
          date,
          homeTeam: rowEntries[5],
          awayTeam: rowEntries[6],
          location: rowEntries[3],
        });
      }
    }
    console.table(games);
  }
}
