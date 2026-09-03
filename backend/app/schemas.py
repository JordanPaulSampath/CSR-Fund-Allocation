"""Pydantic request/response models — this is the contract the frontend codes against."""
from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: str
    company_name: str = ""
    email: str = ""
    role: str = "CSR Manager"
    default_budget: float = 5_000_000


class ProposalIn(BaseModel):
    ngo_name: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    sector: str = Field(..., min_length=1)
    region: str = Field(..., min_length=1)
    requested_amount: float
    beneficiaries: int

    @field_validator("requested_amount")
    @classmethod
    def _amount_positive(cls, v: float) -> float:
        if v is None or v <= 0:
            raise ValueError("requested_amount must be greater than 0")
        if v > 1_000_000_000:
            raise ValueError("requested_amount is unrealistically large")
        return float(v)

    @field_validator("beneficiaries")
    @classmethod
    def _beneficiaries_positive(cls, v: int) -> int:
        if v is None or v <= 0:
            raise ValueError("beneficiaries must be greater than 0")
        return int(v)


class ProposalOut(BaseModel):
    id: int
    ngo_name: str
    title: str
    sector: str
    region: str
    requested_amount: float
    beneficiaries: int
    impact_potential: float
    cost_per_beneficiary: float
    feasibility: float
    final_score: float
    score_breakdown: Dict[str, float]
    allocated_amount: float
    is_funded: bool


class WeightsIn(BaseModel):
    impact: Optional[float] = Field(default=None, ge=0)
    cost_efficiency: Optional[float] = Field(default=None, ge=0)
    feasibility: Optional[float] = Field(default=None, ge=0)


class WeightsOut(BaseModel):
    impact: float
    cost_efficiency: float
    feasibility: float


class AllocationSummary(BaseModel):
    strategy: str
    total_budget: float
    spent: float
    remaining: float
    funded_count: int
    rejected_count: int
    total_score: float
    total_beneficiaries: int
    solver: str


class AllocationResult(BaseModel):
    strategy: str
    total_budget: float
    spent: float
    remaining: float
    funded: List[ProposalOut]
    rejected: List[ProposalOut]
    total_score: float
    total_beneficiaries: int
    solver: str
    notes: List[str] = []


class CompareResult(BaseModel):
    optimizer: AllocationResult
    ranked: AllocationResult
    score_gain: float
    beneficiary_gain: int
    budget_better_used: float
    headline: str


# --------------------------------------------------------------------------- #
# Pillar 5 — implementing-partner matching
# --------------------------------------------------------------------------- #
class PartnerOut(BaseModel):
    id: int
    name: str
    sectors: List[str]
    regions: List[str]
    avg_project_scale: int
    track_record: float
    cycles_completed: int
    contact: str = ""
    registration_no: str = ""


class PartnerMatchCandidate(BaseModel):
    partner_id: int
    name: str
    fit: float
    components: Dict[str, float]
    co_implementation_suggested: bool
    unscored: bool
    badge: Optional[str] = None
    avg_project_scale: int
    track_record: float
    cycles_completed: int
    sectors: List[str]
    regions: List[str]
    contact: str = ""
    rationale: str


class PartnerMatchResult(BaseModel):
    proposal_id: Optional[int] = None
    proposal_title: Optional[str] = None
    proposal_sector: Optional[str] = None
    proposal_region: Optional[str] = None
    beneficiaries: int
    weights: Dict[str, float]
    shortlist: List[PartnerMatchCandidate]
    note: str


# --------------------------------------------------------------------------- #
# Pillar 6 — remaining-budget advisor
# --------------------------------------------------------------------------- #
class BudgetSuggestion(BaseModel):
    type: str
    leftover: float
    target_proposal_id: Optional[int] = None
    target_title: Optional[str] = None
    target_ngo: Optional[str] = None
    target_ask: Optional[float] = None
    coverage: Optional[float] = None
    rationale: str
    strategy: Optional[str] = None
    total_budget: Optional[float] = None
    spent: Optional[float] = None
    candidates_considered: int = 0
