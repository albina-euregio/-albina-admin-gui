CREATE TABLE generic_observations (
    ID varchar(191) NOT NULL COMMENT "External ID of this observation",
    SOURCE varchar(191) NOT NULL COMMENT "Source of this observation",
    OBS_TYPE enum("SimpleObservation", "Evaluation", "Avalanche", "Blasting", "Closure", "Profile", "TimeSeries", "Webcam") NOT NULL COMMENT "Type of this observation", 
    EXTERNAL_URL longtext COMMENT "External URL/image to display as iframe",
    STABILITY enum("good", "fair", "poor", "very_poor") COMMENT "Snowpack stability that can be inferred from this observation",
    ASPECTS set("N", "NE", "E", "SE", "S", "SW", "W", "NW") COMMENT "Aspects corresponding with this observation",
    AUTHOR_NAME varchar(191) COMMENT "Name of the author",
    OBS_CONTENT longtext COMMENT "Free-text content",
    OBS_DATA longtext COMMENT "Additional data (e.g. original data stored when fetching from external API)",
    ELEVATION double precision COMMENT "Elevation in meters",
    ELEVATION_LOWER_BOUND double precision COMMENT "Lower bound of elevation in meters",
    ELEVATION_UPPER_BOUND double precision COMMENT "Upper bound of elevation in meters",
    EVENT_DATE datetime COMMENT "Date when the event occurred",
    LATITUDE double precision COMMENT "Location latitude (WGS 84)",
    LOCATION_NAME varchar(191) COMMENT "Location name",
    LONGITUDE double precision COMMENT "Location longitude (WGS 84)",
    REGION_ID varchar(191) COMMENT "Micro-region code (possibly computed from latitude/longitude)",
    REPORT_DATE datetime COMMENT "Date when the observation has been reported",
    AVALANCHE_PROBLEMS set("new_snow", "wind_slab", "persistent_weak_layers", "wet_snow", "gliding_snow", "favourable_situation", "cornices", "no_distinct_problem") COMMENT "Avalanche problems corresponding with this observation",
    DANGER_PATTERNS set("dp1", "dp2", "dp3", "dp4", "dp5", "dp6", "dp7", "dp8", "dp9", "dp10") COMMENT "Danger patterns corresponding with this observation",
    IMPORTANT_OBSERVATION set("SnowLine", "SurfaceHoar", "Graupel", "StabilityTest", "IceFormation", "VeryLightNewSnow") COMMENT "Important observations",
    PRIMARY KEY (ID, SOURCE)
);
