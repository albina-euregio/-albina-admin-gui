import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import * as Enums from "../../enums/enums";
import { EventEmitter } from "@angular/core";

@Injectable()
export class SettingsService {
  private lang: string;
  public showObservations: boolean;
  public showCaaml: boolean;
  public showJson: boolean;

  eventEmitter: EventEmitter<string> = new EventEmitter();

  constructor(private translateService: TranslateService) {
    // lang
    this.translateService.addLangs(["de", "it", "en", "fr", "es", "ca", "oc"]);

    // this language will be used as a fallback when a translation isn't found in the current language
    this.translateService.setDefaultLang("en");
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    const lang = navigator.language.split("-")[0];
    this.setLangString(lang);

    this.showObservations = true;
    this.showCaaml = false;
    this.showJson = false;
  }

  getLangString(): string {
    return this.lang;
  }

  setLangString(lang: string) {
    if (lang) {
      let language = lang;
      if (this.translateService.langs.indexOf(language) < 0) {
        language = "de";
      }
      document.documentElement.setAttribute("lang", language);
      this.translateService.use(language);
      this.lang = language;

      // to reload iframe
      this.emitChangeEvent(this.lang);
    }
  }

  emitChangeEvent(number) {
    this.eventEmitter.emit(number);
  }
  getChangeEmitter() {
    return this.eventEmitter;
  }

  getShowObservations(): boolean {
    return this.showObservations;
  }

  setShowObservations(showObservations: boolean) {
    this.showObservations = showObservations;
  }

  getShowCaaml(): boolean {
    return this.showCaaml;
  }

  setShowCaaml(showCaaml: boolean) {
    this.showCaaml = showCaaml;
  }

  getShowJson(): boolean {
    return this.showJson;
  }

  setShowJson(showJson: boolean) {
    this.showJson = showJson;
  }
}
