import { GenericObservation, Aspect, ObservationSource, ObservationType, Stability } from "./generic-observation.model";
import * as Enums from "app/enums/enums";

export interface Observation {
  aspect: Aspect;
  authorName: string;
  content: string;
  elevation: number;
  eventDate: string | Date;
  eventTime: string;
  eventType: EventType;
  id: number;
  latitude: number;
  locationName: string;
  longitude: number;
  region: string;
  reportDate?: string | Date;
  reportTime?: string;
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
    stability: getObservationStability(observation),
    $markerRadius: getObservationMarkerRadius(observation),
    eventDate: observation.eventDate ? new Date(observation.eventDate) : undefined,
    reportDate: observation.reportDate ? new Date(observation.reportDate) : undefined
  };
}

export function isAlbinaObservation(observation: GenericObservation): observation is GenericObservation<Observation> {
  return observation.$source === ObservationSource.Albina;
}

function getObservationStability(observation: Observation): Stability {
  switch (observation.eventType ?? EventType.Normal) {
    case EventType.PersonDead:
      return Enums.Stability.weak;
    case EventType.PersonInjured:
      return Enums.Stability.weak;
    case EventType.PersonUninjured:
      return Enums.Stability.weak;
    case EventType.PersonNo:
      return Enums.Stability.weak;
    case EventType.Important:
      return Enums.Stability.medium;
    default:
      return Enums.Stability.unknown;
  }
}

function getObservationMarkerRadius(observation: Observation): number {
  return 15;
}

function getObservationType(observation: Observation): ObservationType {
  switch (observation.eventType ?? EventType.Normal) {
    case EventType.PersonDead:
      return ObservationType.Avalanche;
    case EventType.PersonInjured:
      return ObservationType.Avalanche;
    case EventType.PersonUninjured:
      return ObservationType.Avalanche;
    case EventType.PersonNo:
      return ObservationType.Avalanche;
    default:
      return ObservationType.Observation;
  }
}
