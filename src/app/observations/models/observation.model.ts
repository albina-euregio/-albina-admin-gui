import { GenericObservation, Aspect, ObservationSource, ObservationType } from "./generic-observation.model";

export interface Observation {
  aspect: Aspect;
  authorName: string;
  content: string;
  elevation: number;
  eventDate: string | Date;
  eventType: EventType;
  id: number;
  latitude: number;
  locationName: string;
  longitude: number;
  region: string;
  reportDate?: string | Date;
}

export enum EventType {
  Important = "IMPORTANT",
  NeighborRegion = "NEIGHBOR_REGION",
  Normal = "NORMAL",
  PersonDead = "PERSON_DEAD",
  PersonInjured = "PERSON_INJURED",
  PersonNo = "PERSON_NO",
  PersonUninjured = "PERSON_UNINJURED",
  PersonUnknown = "PERSON_UNKNOWN",
  Traffic = "TRAFFIC"
}

export function convertObservationToGeneric(observation: Observation): GenericObservation<Observation> {
  return {
    ...observation,
    $data: observation,
    $extraDialogRows: null,
    $source: ObservationSource.Albina,
    $type: getObservationType(observation),
    $markerColor: getObservationMarkerColor(observation),
    $markerRadius: getObservationMarkerRadius(observation),
    eventDate: observation.eventDate ? new Date(observation.eventDate) : undefined,
    reportDate: observation.reportDate ? new Date(observation.reportDate) : undefined
  };
}

export function isAlbinaObservation(observation: GenericObservation): observation is GenericObservation<Observation> {
  return observation.$source === ObservationSource.Albina;
}

function getObservationMarkerColor(observation: Observation): string {
  // TODO implement
  return "blue";
}

function getObservationMarkerRadius(observation: Observation): number {
  // TODO implement
  return 15;
}

function getObservationType(observation: Observation): ObservationType {
  // TODO implement
  return ObservationType.Observation;
}
