 import { BulletinElevationDescriptionModel } from "./bulletin-elevation-description.model";
import { TextModel } from './text.model';
import * as Enums from '../enums/enums';

export class BulletinModel {
	public id: string;

	public aggregatedRegionId: string;

	public validFrom: Date;
	public validUntil: Date;

	public regions: String[];
	public elevation: number;
	public above: BulletinElevationDescriptionModel;
	public below: BulletinElevationDescriptionModel;

	public avalancheSituationHighlight: TextModel[];
	public avalancheSituationComment: TextModel[];

	public snowpackStructureHighlight: TextModel[];
	public snowpackStructureComment: TextModel[];

	public status: Enums.BulletinStatus;

	constructor(bulletin?: BulletinModel) {
		if (bulletin) {
			this.aggregatedRegionId = bulletin.aggregatedRegionId;
			this.validFrom = bulletin.validFrom;
			this.validUntil = bulletin.validUntil;
			this.regions = bulletin.regions;
			this.above = bulletin.above;
			this.below = bulletin.below;
			this.status = bulletin.status;
			this.avalancheSituationHighlight = bulletin.avalancheSituationHighlight;
			this.avalancheSituationComment = bulletin.avalancheSituationComment;
			this.snowpackStructureHighlight = bulletin.snowpackStructureHighlight;
			this.snowpackStructureComment = bulletin.snowpackStructureComment;
			this.elevation = bulletin.elevation;
		} else {
			this.aggregatedRegionId = undefined;
			this.validFrom = undefined;
			this.validUntil = undefined;
			this.regions = new Array<String>();
			this.above = new BulletinElevationDescriptionModel();
			this.below = new BulletinElevationDescriptionModel();
			this.status = undefined;
			this.avalancheSituationHighlight = new Array<TextModel>();
			this.avalancheSituationComment = new Array<TextModel>();
			this.snowpackStructureHighlight = new Array<TextModel>();
			this.snowpackStructureComment = new Array<TextModel>();
			this.elevation = undefined;
		}
	}

	getId() : string {
		return this.id;
	}

	setId(id: string) {
		this.id = id;
	}

	getAggregatedRegionId() : string {
		return this.aggregatedRegionId;
	}

	setAggregatedRegionId(aggregatedRegionId: string) {
		this.aggregatedRegionId = aggregatedRegionId;
	}

	getValidFrom() : Date{
		return this.validFrom
	}

	setValidFrom(validFrom: Date) {
		this.validFrom = validFrom;
	}

	getValidUntil() : Date {
		return this.validUntil;
	}

	setValidUntil(validUntil: Date) {
		this.validUntil = validUntil;
	}

	getRegions() : String[] {
		return this.regions;
	}

	setRegions(regions: String[]) {
		this.regions = regions;
	}

	getElevation() : number {
		return this.elevation
	}

	setElevation(elevation: number) {
		this.elevation = elevation;
	}

	getAbove() : BulletinElevationDescriptionModel {
		return this.above
	}

	setAbove(above: BulletinElevationDescriptionModel) {
		this.above = above;
	}

	getBelow() : BulletinElevationDescriptionModel {
		return this.below
	}

	setBelow(below: BulletinElevationDescriptionModel) {
		this.below = below;
	}

	getStatus() : Enums.BulletinStatus {
		return this.status;
	}

	setStatus(status: Enums.BulletinStatus) {
		this.status = status;
	}

	getAvalancheSituationHighlight() : TextModel[] {
		return this.avalancheSituationHighlight;
	}

	getAvalancheSituationHighlightIn(language: Enums.LanguageCode) : string {
		for (var i = this.avalancheSituationHighlight.length - 1; i >= 0; i--) {
			if (this.avalancheSituationHighlight[i].getLanguageCode() == language)
				return this.avalancheSituationHighlight[i].getText();
		}
	}

	getAvalancheSituationHighlightInString(language: string) : string {
		return this.getAvalancheSituationHighlightIn(Enums.LanguageCode[language]);
	}

	setAvalancheSituationHighlight(avalancheSituationHighlight: TextModel[]) {
		this.avalancheSituationHighlight = avalancheSituationHighlight;
	}

	getAvalancheSituationComment() : TextModel[] {
		return this.avalancheSituationComment;
	}

	getAvalancheSituationCommentIn(language: Enums.LanguageCode) : string {
		for (var i = this.avalancheSituationComment.length - 1; i >= 0; i--) {
			if (this.avalancheSituationComment[i].getLanguageCode() == language)
				return this.avalancheSituationComment[i].getText();
		}
	}

	setAvalancheSituationComment(avalancheSituationComment: TextModel[]) {
		this.avalancheSituationComment = avalancheSituationComment;
	}

	getSnowpackStructureHighlightIn(language: Enums.LanguageCode) : string {
		for (var i = this.snowpackStructureHighlight.length - 1; i >= 0; i--) {
			if (this.snowpackStructureHighlight[i].getLanguageCode() == language)
				return this.snowpackStructureHighlight[i].getText();
		}
	}

	getSnowpackStructureHighlightInString(language: string) : string {
		return this.getSnowpackStructureHighlightIn(Enums.LanguageCode[language]);
	}

	setSnowpackStructureHighlight(snowpackStructureHighlight: TextModel[]) {
		this.snowpackStructureHighlight = snowpackStructureHighlight;
	}

	getSnowpackStructureComment() : TextModel[] {
		return this.snowpackStructureComment;
	}

	getSnowpackStructureCommentIn(language: Enums.LanguageCode) : string {
		for (var i = this.snowpackStructureComment.length - 1; i >= 0; i--) {
			if (this.snowpackStructureComment[i].getLanguageCode() == language)
				return this.snowpackStructureComment[i].getText();
		}
	}

	setSnowpackStructureComment(snowpackStructureComment: TextModel[]) {
		this.snowpackStructureComment = snowpackStructureComment;
	}

	toJson() {
		var json = Object();

		if (this.id && this.id != undefined)
			json['id'] = this.id;
		if (this.aggregatedRegionId && this.aggregatedRegionId != undefined)
			json['aggregatedRegionId'] = this.aggregatedRegionId;
		
		var validity = Object();
		if (this.validFrom && this.validFrom != undefined)
			validity['from'] = this.validFrom;
		if (this.validUntil && this.validUntil != undefined)
			validity['until'] = this.validUntil;
		json['validity'] = validity;

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

		if (this.avalancheSituationHighlight && this.avalancheSituationHighlight.length > 0) {
			let avalancheSituationHighlight = [];
			for (let i = 0; i <= this.avalancheSituationHighlight.length - 1; i++) {
				avalancheSituationHighlight.push(this.avalancheSituationHighlight[i].toJson());
			}
			json['avalancheSituationHighlight'] = avalancheSituationHighlight;
		}
		if (this.avalancheSituationComment && this.avalancheSituationComment.length > 0) {
			let avalancheSituationComment = [];
			for (let i = 0; i <= this.avalancheSituationComment.length - 1; i++) {
				avalancheSituationComment.push(this.avalancheSituationComment[i].toJson());
			}
			json['avalancheSituationComment'] = avalancheSituationComment;
		}

		if (this.snowpackStructureHighlight && this.snowpackStructureHighlight.length > 0) {
			let snowpackStructureHighlight = [];
			for (let i = 0; i <= this.snowpackStructureHighlight.length - 1; i++) {
				snowpackStructureHighlight.push(this.snowpackStructureHighlight[i].toJson());
			}
			json['snowpackStructureHighlight'] = snowpackStructureHighlight;
		}
		if (this.snowpackStructureComment && this.snowpackStructureComment.length > 0) {
			let snowpackStructureComment = [];
			for (let i = 0; i <= this.snowpackStructureComment.length - 1; i++) {
				snowpackStructureComment.push(this.snowpackStructureComment[i].toJson());
			}
			json['snowpackStructureComment'] = snowpackStructureComment;
		}

		return json;
	}

	static createFromJson(json) {
		let bulletin = new BulletinModel();

		bulletin.setId(json.id);
		bulletin.setAggregatedRegionId(json.aggregatedRegionId);

		bulletin.setValidFrom(new Date(json.validity.from));
		bulletin.setValidUntil(new Date(json.validity.until));

		let jsonRegions = json.regions;
		let regions = new Array<String>();
		for (let i in jsonRegions) {
			regions.push(jsonRegions[i]);
		}
		bulletin.setRegions(regions);

		bulletin.setElevation(json.elevation);

		if (json.above)
			bulletin.setAbove(BulletinElevationDescriptionModel.createFromJson(json.above));
		if (json.below)
			bulletin.setBelow(BulletinElevationDescriptionModel.createFromJson(json.below));

		bulletin.setStatus(Enums.BulletinStatus[<string>json.status]);

		let jsonAvalancheSituationHighlight = json.avalancheSituationHighlight;
		let avalancheSituationHighlight = new Array<TextModel>();
		for (let i in jsonAvalancheSituationHighlight) {
			avalancheSituationHighlight.push(TextModel.createFromJson(jsonAvalancheSituationHighlight[i]));
		}
		bulletin.setAvalancheSituationHighlight(avalancheSituationHighlight);

		let jsonAvalancheSituationComment = json.avalancheSituationComment;
		let avalancheSituationComment = new Array<TextModel>();
		for (let i in jsonAvalancheSituationComment) {
			avalancheSituationComment.push(TextModel.createFromJson(jsonAvalancheSituationComment[i]));
		}
		bulletin.setAvalancheSituationComment(avalancheSituationComment);

		let jsonSnowpackStructureHighlight = json.snowpackStructureHighlight;
		let snowpackStructureHighlight = new Array<TextModel>();
		for (let i in jsonSnowpackStructureHighlight) {
			snowpackStructureHighlight.push(TextModel.createFromJson(jsonSnowpackStructureHighlight[i]));
		}
		bulletin.setSnowpackStructureHighlight(snowpackStructureHighlight);

		let jsonSnowpackStructureComment = json.snowpackStructureComment;
		let snowpackStructureComment = new Array<TextModel>();
		for (let i in jsonSnowpackStructureComment) {
			snowpackStructureComment.push(TextModel.createFromJson(jsonSnowpackStructureComment[i]));
		}
		bulletin.setSnowpackStructureComment(snowpackStructureComment);

		return bulletin;
	}
}