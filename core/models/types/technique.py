from enum import Enum


class Technique(str, Enum):
    CANDIDATES = "CANDIDATES"
    ELIMINATION = "ELIMINATION"
    TRIAL_AND_ERROR = "TRIAL_AND_ERROR"
    INTUITION = "INTUITION"
