import { BulletinElevationDescriptionModel } from "./bulletin-elevation-description.model";
import * as Enums from '../enums/enums';

export class BulletinModel {
	public validFrom: Date;
	public validUntil: Date;

	public regions: String[];
	public elevation: number;
	public above: BulletinElevationDescriptionModel;
	public below: BulletinElevationDescriptionModel;

	public status: Enums.BulletinStatus;

	constructor() {
		this.validFrom = undefined;
		this.validUntil = undefined;
		this.regions = new Array<String>();
		this.above = new BulletinElevationDescriptionModel();
		this.below = new BulletinElevationDescriptionModel();
		this.status = undefined;
	}

	getValidFrom() {
		return this.validFrom
	}

	setValidFrom(validFrom) {
		this.validFrom = validFrom;
	}

	getValidUntil() {
		return this.validUntil;
	}

	setValidUntil(validUntil) {
		this.validUntil = validUntil;
	}

	getRegions() {
		return this.regions;
	}

	setRegions(regions) {
		this.regions = regions;
	}

	getElevation() {
		return this.elevation
	}

	setElevation(elevation) {
		this.elevation = elevation;
	}

	getAbove() {
		return this.above
	}

	setAbove(above) {
		this.above = above;
	}

	getBelow() {
		return this.below
	}

	setBelow(below) {
		this.below = below;
	}

	getStatus() : Enums.BulletinStatus {
		return this.status;
	}

	setStatus(status: Enums.BulletinStatus) {
		this.status = status;
	}

	toJson() {
		var json = Object();
		
		if (this.validFrom && this.validFrom != undefined)
			json['validFrom'] = this.validFrom;
		if (this.validUntil && this.validUntil != undefined)
			json['validUntil'] = this.validUntil;

		if (this.regions && this.regions.length > 0) {
			let regions = [];
			for (let i = 0; i <= this.regions.length - 1; i++) {
				regions.push(this.regions[i]);
			}
			json['regions'] = regions;
		}

		if (this.elevation && this.elevation != undefined)
			json['elevation'] = this.elevation;
		
		if (this.above && this.above != undefined)
			json['above'] = this.above.toJson();
		if (this.below && this.below != undefined)
			json['below'] = this.below.toJson();

		if (this.status && this.status != undefined)
			json['status'] = this.status;

		return json;
	}

	static createFromJson(json) {
		let bulletin = new BulletinModel();

		bulletin.setValidFrom(new Date(json.validity.from));
		bulletin.setValidUntil(new Date(json.validity.until));

		let jsonRegions = json.regions;
		let regions = new Array<String>();
		for (let i in jsonRegions) {
			regions.push(jsonRegions[i]);
		}
		bulletin.setRegions(regions);

		bulletin.setAbove(BulletinElevationDescriptionModel.createFromJson(json.above));
		bulletin.setBelow(BulletinElevationDescriptionModel.createFromJson(json.below));

		bulletin.setStatus(Enums.BulletinStatus[<string>json.status]);

		return bulletin;
	}
}