export type PartnerApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'deleted';

export type PartnerApprovalFields = {
  approval_status?: PartnerApprovalStatus | string | null;
  rejection_reason?: string | null;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  deleted_at?: string | null;
  subscription_status?: string | null;
};

export function getPartnerApprovalStatus(
  partner: PartnerApprovalFields | null | undefined,
): PartnerApprovalStatus {
  const status = partner?.approval_status;
  if (
    status === 'pending' ||
    status === 'rejected' ||
    status === 'suspended' ||
    status === 'deleted'
  ) {
    return status;
  }
  return 'approved';
}

export function isPartnerApproved(partner: PartnerApprovalFields | null | undefined) {
  return getPartnerApprovalStatus(partner) === 'approved';
}
