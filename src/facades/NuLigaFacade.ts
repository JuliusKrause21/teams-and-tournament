import { injectable } from 'inversify';
import fetch from 'node-fetch';

@injectable()
export class NuLigaFacade {
  public async fetchHtml(): Promise<string> {
    try {
      const response = await fetch(
        'https://bhv-handball.liga.nu/cgi-bin/WebObjects/nuLigaHBDE.woa/wa/teamPortrait?teamtable=1977635&pageState=vorrunde&championship=AV+2024%2F25&group=378716'
      );
      return response.text();
    } catch (error) {
      throw new Error('Failed to fetch data from NuLiga');
    }
  }
}
