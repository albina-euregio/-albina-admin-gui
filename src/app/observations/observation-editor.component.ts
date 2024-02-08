import { Component, Input } from "@angular/core";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { Observation, EventType } from "./models/observation.model";
import { Feature, Point } from "geojson";
import { SelectItem, SharedModule } from "primeng/api";
import { GeocodingProperties, GeocodingService } from "./geocoding.service";
import { geocoders } from "leaflet-control-geocoder";
import { CoordinateDataService } from "app/providers/map-service/coordinate-data.service";
import { InputTextareaModule } from "primeng/inputtextarea";
import { AutoCompleteModule } from "primeng/autocomplete";
import { InputTextModule } from "primeng/inputtext";
import { FormsModule } from "@angular/forms";
import { DropdownModule } from "primeng/dropdown";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  imports: [
    AutoCompleteModule,
    CommonModule,
    DropdownModule,
    FormsModule,
    InputTextareaModule,
    InputTextModule,
    SharedModule,
    TranslateModule,
  ],
  providers: [TranslateService, GeocodingService, CoordinateDataService],
  selector: "app-observation-editor",
  templateUrl: "observation-editor.component.html",
  styleUrls: ["observation-editor.component.scss"],
})
export class ObservationEditorComponent {
  constructor(
    private translate: TranslateService,
    private geocodingService: GeocodingService,
    private coordinateDataService: CoordinateDataService,
  ) {}

  @Input() observation: Observation;
  eventTypes: SelectItem[] = Object.values(EventType).map((value) => ({
    label: this.translate.instant(`observations.eventTypes.${value}`),
    value,
  }));
  locationResults: Feature<Point, GeocodingProperties>[] = [];

  newLocation() {
    if (this.observation.latitude && this.observation.longitude) {
      const floatLat = parseFloat(this.observation.latitude as any);
      const floatLng = parseFloat(this.observation.longitude as any);

      this.coordinateDataService.getCoordData(floatLat, floatLng).subscribe((data) => {
        this.observation.elevation = data.height;
        // this.observation.aspect = data.aspect as Aspect;
        // console.log(data);
      });
    }
  }

  copyLatLng() {
    navigator.clipboard.writeText(`${this.observation.latitude}, ${this.observation.longitude}`);
  }

  setLatitude(event) {
    this.observation.latitude = event.target.value as number;
    this.newLocation();
  }

  setLongitude(event) {
    this.observation.longitude = event.target.value as number;
    this.newLocation();
  }

  searchLocation($event: { originalEvent: Event; query: string }) {
    this.geocodingService
      .searchLocation($event.query)
      .subscribe((collection) => (this.locationResults = collection.features));
  }

  selectLocation(feature: Feature<Point, GeocodingProperties>): void {
    setTimeout(() => {
      // display_name	"Zischgeles, Gemeinde Sankt Sigmund im Sellrain, Bezirk Innsbruck-Land, Tirol, Österreich" -> "Zischgeles"
      this.observation.locationName = feature.properties.display_name.replace(/,.*/, "");
      const lat = feature.geometry.coordinates[1];
      const lng = feature.geometry.coordinates[0];

      this.observation.latitude = lat;
      this.observation.longitude = lng;

      this.newLocation();
    }, 0);
  }

  setEventDate(event) {
    const date = (this.observation.eventDate as string) || "T00:00";
    const time = date.split("T")[1];
    this.observation.eventDate = `${event.target.value}T${time}`;
  }

  setReportDate(event) {
    const date = (this.observation.reportDate as string) || "T00:00";
    const time = date.split("T")[1];
    this.observation.reportDate = `${event.target.value}T${time}`;
  }

  setEventTime(event) {
    const fullDate = (this.observation.eventDate as string) || "T00:00";
    const date = fullDate.split("T")[0];
    this.observation.eventDate = `${date}T${event.target.value}`;
  }

  setReportTime(event) {
    const fullDate = (this.observation.reportDate as string) || "T00:00";
    const date = fullDate.split("T")[0];
    this.observation.reportDate = `${date}T${event.target.value}`;
  }

  getDate(obj: string | Date) {
    const date = (obj as string) || "T00:00";
    return date?.split("T")[0];
  }

  getTime(obj: string | Date) {
    const date = (obj as string) || "T00:00";
    return date?.split("T")[1] || "00:00";
  }

  parseContent($event: { clipboardData: DataTransfer }): void {
    const codes = {
      "ALP-LAW-NEG": EventType.PersonNo,
      "ALP-LAW-UNKL": EventType.PersonUninjured,
      "ALP-LAW-KLEIN": EventType.PersonUninjured,
      "ALP-LAW-GROSS": EventType.PersonUninjured,
      "ALP-LAW-FREI": EventType.PersonUninjured,
    };

    setTimeout(() => {
      const content = this.observation.content;
      if (!this.observation.authorName && content.includes('Einsatzcode') && content.includes('beschickte Einsatzmittel')) {
        this.observation.authorName = "Leitstelle Tirol";

        const code = content.match(/Einsatzcode:\s*(.*)\n/)[1];
        if (codes[code]) this.observation.eventType = codes[code];
      }
      if (!this.observation.locationName && content.includes('Einsatzort')) {
        const match = content.match(/Einsatzort:.*\n\s+.*\s+(.*)/);
        if (match) {
          this.observation.locationName = match[1];
        }
      }
      if (!this.observation.latitude && !this.observation.longitude && content.includes('Koordinaten: WGS84')) {
        const match = content.match(/Koordinaten: WGS84(.*)/);
        const latlng = match && match[1] ? geocoders.parseLatLng(match[1].trim()) : "";
        if (latlng) {
          this.observation.latitude = latlng.lat;
          this.observation.longitude = latlng.lng;

          this.newLocation();
        }
      }
    });
  }
}
