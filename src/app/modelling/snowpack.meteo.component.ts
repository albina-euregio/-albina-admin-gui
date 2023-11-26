import { Component, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

import { ModellingService } from "./modelling.service";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { TranslateModule } from "@ngx-translate/core";
import { NgFor } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  standalone: true,
  imports: [FormsModule, NgFor, TranslateModule],
  templateUrl: "./snowpack.meteo.component.html"
})
export class SnowpackMeteoComponent implements OnInit {
  snowpackMeteoPlots: string[];
  snowpackMeteoPlot: string;
  plotUrl: SafeResourceUrl;
  @ViewChild("iframe") iframe;

  constructor(
    private constantsService: ConstantsService,
    private modellingService: ModellingService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.snowpackMeteoPlots = this.modellingService.getSnowpackMeteoPlots();
    this.snowpackMeteoPlot = this.snowpackMeteoPlots[0];
    this.updatePlotUrl();
  }

  updatePlotUrl() {
    const url = [this.constantsService.snowpackModelsUrl, this.snowpackMeteoPlot, ".html"].join("");
    this.plotUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  toggleFullscreen() {
    const element: HTMLIFrameElement = this.iframe.nativeElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  }
}
