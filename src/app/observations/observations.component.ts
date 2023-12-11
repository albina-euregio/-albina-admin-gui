import {
  Component,
  AfterContentInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
} from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { ObservationsService } from "./observations.service";
import { RegionsService, RegionProperties } from "../providers/regions-service/regions.service";
import { BaseMapService } from "../providers/map-service/base-map.service";
import {
  GenericObservation,
  ObservationFilterType,
  ObservationSource,
  ObservationTableRow,
  toGeoJSON,
  toObservationTable,
  LocalFilterTypes,
  ChartsData,
  AvalancheProblem,
  DangerPattern,
  ImportantObservation,
  Stability,
  genericObservationSchema,
} from "./models/generic-observation.model";

import { MenuItem, SharedModule } from "primeng/api";

import { saveAs } from "file-saver";

import { ObservationTableComponent } from "./observation-table.component";
import { GenericFilterToggleData, ObservationFilterService } from "./observation-filter.service";
import { ObservationMarkerService } from "./observation-marker.service";
import { CommonModule } from "@angular/common";
import type { Observable } from "rxjs";
import { ElevationService } from "../providers/map-service/elevation.service";
import { PipeModule } from "../pipes/pipes.module";
import { DialogModule } from "primeng/dialog";
import { BarChartComponent } from "./charts/bar-chart.component";
import { RoseChartComponent } from "./charts/rose-chart.component";
import { MenubarModule } from "primeng/menubar";
import { InputTextModule } from "primeng/inputtext";
import { CalendarModule } from "primeng/calendar";
import { MultiSelectModule } from "primeng/multiselect";
import { FormsModule } from "@angular/forms";
import { ToggleButtonModule } from "primeng/togglebutton";
import { ButtonModule } from "primeng/button";
import {
  AlbinaObservationsService,
  AwsObservationsService,
  FotoWebcamObservationsService,
  LawisObservationsService,
  LolaKronosObservationsService,
  LwdKipObservationsService,
  PanomaxObservationsService,
  WikisnowObservationsService,
} from "./sources";

//import { BarChart } from "./charts/bar-chart/bar-chart.component";
declare var L: any;

export interface MultiselectDropdownData {
  id: string;
  name: string;
}

@Component({
  standalone: true,
  imports: [
    BarChartComponent,
    ButtonModule,
    CalendarModule,
    CommonModule,
    DialogModule,
    FormsModule,
    InputTextModule,
    MenubarModule,
    MultiSelectModule,
    ObservationTableComponent,
    PipeModule,
    RoseChartComponent,
    SharedModule,
    ToggleButtonModule,
    TranslateModule,
  ],
  providers: [
    BaseMapService,
    ElevationService,
    ObservationFilterService,
    ObservationMarkerService,
    ObservationsService,
    RegionsService,
    TranslateService,
    AlbinaObservationsService,
    AwsObservationsService,
    FotoWebcamObservationsService,
    LawisObservationsService,
    LolaKronosObservationsService,
    LwdKipObservationsService,
    PanomaxObservationsService,
    WikisnowObservationsService,
  ],
  templateUrl: "observations.component.html",
  styleUrls: ["./observations.component.scss"],
})
export class ObservationsComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  public loading: Observable<GenericObservation<any>> | undefined = undefined;
  public layout: "map" | "table" | "chart" = "map";
  public layoutFilters = true;
  public observations: GenericObservation[] = [];
  public localObservations: GenericObservation[] = [];
  public showObservationsWithoutCoordinates: boolean = false;
  public observationsWithoutCoordinates: number = 0;
  public observationPopup: {
    observation: GenericObservation;
    table: ObservationTableRow[];
    iframe: SafeResourceUrl;
  };

  public readonly allRegions: RegionProperties[];
  public readonly allSources: MultiselectDropdownData[];
  public selectedRegionItems: string[];
  public selectedSourceItems: ObservationSource[];
  public chartsData: ChartsData = {
    Elevation: {},
    Aspects: {},
    AvalancheProblem: {},
    Stability: {},
    ObservationType: {},
    ImportantObservation: {},
    DangerPattern: {},
    Days: {},
  };
  public moreItems: MenuItem[];
  @ViewChild("observationsMap") mapDiv: ElementRef<HTMLDivElement>;
  @ViewChild("observationTable")
  observationTableComponent: ObservationTableComponent;

  public get LocalFilterTypes(): typeof LocalFilterTypes {
    return LocalFilterTypes;
  }

  constructor(
    public filter: ObservationFilterService,
    public markerService: ObservationMarkerService,
    private translateService: TranslateService,
    private observationsService: ObservationsService,
    private fotoWebcam: FotoWebcamObservationsService,
    private sanitizer: DomSanitizer,
    private regionsService: RegionsService,
    private elevationService: ElevationService,
    public mapService: BaseMapService,
  ) {
    this.allRegions = this.regionsService
      .getRegionsEuregio()
      .features.map((f) => f.properties)
      .sort((r1, r2) => r1.id.localeCompare(r2.id));

    this.allSources = Object.keys(ObservationSource).map((key) => {
      return { id: key, name: key };
    });

    this.moreItems = [
      {
        label: "Mehr",
        items: [
          {
            label: "Export",
            icon: "",
            command: (event) => {
              this.exportObservations();
            },
          },
        ],
      },
    ];
  }

  ngAfterContentInit() {
    this.filter.days = 1;
  }

  ngAfterViewInit() {
    this.mapService.initMaps(this.mapDiv.nativeElement, (o) => this.onObservationClick(o));
    this.mapService.addInfo();

    // this.observationsService
    //   .getWebcams()
    //   .subscribe((cams) => console.log(cams));

    this.loadObservations({ days: 7 });
    this.mapService.map.on("click", () => {
      this.filter.regions = this.mapService.getSelectedRegions().map((aRegion) => aRegion.id);
      this.applyLocalFilter();
    });
  }

  ngOnDestroy() {
    this.mapService.resetAll();
    if (this.mapService.map) {
      this.mapService.map.remove();
      this.mapService.map = undefined;
    }
  }

  onDropdownSelect(target: string, event: any) {
    switch (target) {
      case "regions":
        this.filter.regions = event.value;
        this.mapService.clickRegion(event.value);
        this.applyLocalFilter();
        break;
      case "sources":
        this.filter.observationSources = event.value;
        this.applyLocalFilter();
        break;
      default:
    }
  }

  onDropdownDeSelect(target: string, item: any) {
    switch (target) {
      case "regions":
        this.filter.regions = this.filter.regions.filter((e) => e !== item.id);
        this.applyLocalFilter();
        break;
      case "sources":
        this.filter.observationSources = this.filter.observationSources.filter((e) => e !== item.id);
        this.applyLocalFilter();
        break;
      default:
    }
  }

  onSidebarChange(e: Event) {
    if (e.type === "opening") {
      this.layout = "map";
    }
  }

  newObservation() {
    this.layout = "table";
    this.observationTableComponent.newObservation();
  }

  observationTableFilterGlobal(value: string) {
    this.observationTableComponent.observationTable.filterGlobal(value, "contains");
  }

  parseObservation(observation: GenericObservation): GenericObservation {
    const avalancheProblems = Object.values(AvalancheProblem);
    const dangerPatterns = Object.values(DangerPattern);
    const stabilities = Object.values(Stability);
    const importantObservations = Object.values(ImportantObservation);

    const matches = [...observation.content.matchAll(/#\S*(?=\s|$)/g)].map((el) => el[0].replace("#", ""));
    matches.forEach((match) => {
      if (avalancheProblems.includes(match as AvalancheProblem)) {
        if (!observation.avalancheProblems) observation.avalancheProblems = [];
        observation.avalancheProblems.push(match as AvalancheProblem);
      } else if (dangerPatterns.includes(match as DangerPattern)) {
        if (!observation.dangerPatterns) observation.dangerPatterns = [];
        observation.dangerPatterns.push(match as DangerPattern);
      } else if (importantObservations.includes(match as ImportantObservation)) {
        if (!observation.importantObservations) observation.importantObservations = [];
        observation.importantObservations.push(match as ImportantObservation);
      } else if (stabilities.includes(match as Stability)) {
        observation.stability = match as Stability;
      }
    });

    console.log(observation);
    return observation;
  }

  loadObservations({ days }: { days?: number } = {}) {
    if (typeof days === "number") {
      this.filter.days = days;
    }
    this.clear();
    this.loading = this.observationsService.loadAll();
    this.loading
      .forEach((observation) => {
        try {
          genericObservationSchema.parse(observation);
        } catch (err) {
          console.warn("Observation does not match schema", observation, err);
        }
        if (this.filter.inDateRange(observation)) {
          if (observation.$source === ObservationSource.AvalancheWarningService) {
            observation = this.parseObservation(observation);
          }
          if (!observation.elevation) {
            this.elevationService.getElevation(observation.latitude, observation.longitude).subscribe((elevation) => {
              observation.elevation = elevation;
              this.addObservation(observation);
            });
          } else {
            this.addObservation(observation);
          }
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading = undefined;
        this.applyLocalFilter();
      });

    const webcams = this.fotoWebcam.getFotoWebcamsEU();
    webcams
      .forEach((webcam) => {
        if (this.filter.inDateRange(webcam)) {
          this.addObservation(webcam);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        this.loading = undefined;
        this.applyLocalFilter();
      });
  }

  private clear() {
    this.observationsWithoutCoordinates = 0;
    this.observations.length = 0;
    Object.values(this.mapService.observationTypeLayers).forEach((layer) => layer.clearLayers());
  }

  exportObservations() {
    const collection: GeoJSON.FeatureCollection = toGeoJSON(this.observations);
    const json = JSON.stringify(collection, undefined, 2);
    const blob = new Blob([json], { type: "application/geo+json" });
    saveAs(blob, "observations.geojson");
  }

  get observationPopupVisible(): boolean {
    return this.observationPopup !== undefined;
  }

  set observationPopupVisible(value: boolean) {
    if (value) {
      throw Error(String(value));
    }
    this.observationPopup = undefined;
  }

  toggleFilter(data: GenericFilterToggleData = {} as GenericFilterToggleData) {
    if (data?.type && data.data.markerClassify) {
      if (data?.type !== this.markerService.markerClassify) {
        this.markerService.markerClassify = data.type;
      } else {
        this.markerService.markerClassify = undefined;
      }
    } else if (data?.type && data.data.markerLabel) {
      if (data?.type !== this.markerService.markerLabel) {
        this.markerService.markerLabel = data.type;
      } else {
        this.markerService.markerLabel = undefined;
      }
    } else if (data?.type) {
      this.filter.toggleFilter(data);
    }
    this.applyLocalFilter();
  }

  setDate() {
    this.filter.setDateRange();
    this.loadObservations({});
  }

  applyLocalFilter() {
    Object.values(this.mapService.observationTypeLayers).forEach((layer) => layer.clearLayers());
    this.observations.forEach((observation) => {
      observation.filterType =
        this.filter.inObservationSources(observation) && this.filter.isSelected(observation)
          ? ObservationFilterType.Local
          : ObservationFilterType.Global;
      observation.isHighlighted = this.filter.isHighlighted(observation);
    });

    this.localObservations = [];
    this.observations.forEach((observation) => {
      if (observation.filterType === ObservationFilterType.Local || observation.isHighlighted) {
        this.localObservations.push(observation);
        this.markerService
          .createMarker(observation)
          ?.on("click", () => this.onObservationClick(observation))
          ?.addTo(this.mapService.observationTypeLayers[observation.$type]);
      }
    });
    this.buildChartsData();
  }

  buildChartsData() {
    this.chartsData.Elevation = this.filter.getElevationDataset(this.observations);

    this.chartsData.Aspects = this.filter.getAspectDataset(this.observations);

    this.chartsData.Stability = this.filter.getStabilityDataset(this.observations);

    this.chartsData.ObservationType = this.filter.getObservationTypeDataset(this.observations);

    this.chartsData.ImportantObservation = this.filter.getImportantObservationDataset(this.observations);

    this.chartsData.AvalancheProblem = this.filter.getAvalancheProblemDataset(this.observations);

    this.chartsData.DangerPattern = this.filter.getDangerPatternDataset(this.observations);

    this.chartsData.Days = this.filter.getDaysDataset(this.observations);
  }

  private addObservation(observation: GenericObservation): void {
    observation.filterType = ObservationFilterType.Local;

    this.regionsService.augmentRegion(observation);

    this.observations.push(observation);
    this.observations.sort((o1, o2) => (+o1.eventDate === +o2.eventDate ? 0 : +o1.eventDate < +o2.eventDate ? 1 : -1));

    const marker = this.markerService
      .createMarker(observation)
      ?.on("click", () => this.onObservationClick(observation))
      ?.addTo(this.mapService.observationTypeLayers[observation.$type]);
    if (!marker) {
      this.observationsWithoutCoordinates++;
    }
  }

  onObservationClick(observation: GenericObservation): void {
    if (observation.$externalURL) {
      const iframe = this.sanitizer.bypassSecurityTrustResourceUrl(observation.$externalURL);
      this.observationPopup = { observation, table: [], iframe };
    } else {
      const extraRows = Array.isArray(observation.$extraDialogRows) ? observation.$extraDialogRows : [];
      const rows = toObservationTable(observation);
      const table = [...rows, ...extraRows].map((row) => ({
        ...row,
        label: row.label.startsWith("observations.") ? this.translateService.instant(row.label) : row.label,
      }));
      this.observationPopup = { observation, table, iframe: undefined };
    }
  }

  toggleFilters() {
    this.layoutFilters = !this.layoutFilters;
    this.mapService.map.invalidateSize();
  }

  @HostListener("document:keydown", ["$event"])
  handleKeyBoardEvent(event: KeyboardEvent | { key: "ArrowLeft" | "ArrowRight" }) {
    if (!this.observationPopupVisible || !this.observationPopup?.observation) {
      return;
    }
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }
    let observation = this.observationPopup?.observation;
    const observations = this.observations.filter(
      (o) => o.$source === observation.$source && o.$type === observation.$type,
    );
    const index = observations.indexOf(observation);
    if (index < 0) {
      return;
    }
    if (event.key === "ArrowRight") {
      observation = observations[index + 1];
    } else if (event.key === "ArrowLeft") {
      observation = observations[index - 1];
    }
    if (observation) {
      this.onObservationClick(observation);
    }
  }
}
