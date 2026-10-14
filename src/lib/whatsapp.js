/**
 * Generates WhatsApp deep-link URLs (wa.me) with context-aware pre-filled messages
 */

export function buildWhatsAppUrl({ phone, message = '' }) {
  if (!phone) return '';
  // Clean phone number: remove non-digits, prepend 91 for Indian numbers if 10 digits
  const digits = phone.replace(/\D/g, '');
  const cleanPhone = digits.length === 10 ? `91${digits}` : digits;
  const encodedMsg = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanPhone}${encodedMsg ? '?text=' + encodedMsg : ''}`;
}

export function formatWhatsAppMessage({
  context, // 'rep_to_doctor_approved' | 'rep_to_doctor_declined' | 'rep_to_doctor_profile' | 'doctor_to_rep_cancelled' | 'doctor_to_rep_moved' | 'doctor_to_rep_clear_day'
  repName = '',
  companyName = '',
  doctorName = '',
  clinicName = '',
  slotDate = '',
  slotStart = '',
  token = '',
  productName = '',
  cancelReason = '',
  newSlotDate = '',
  newSlotStart = '',
}) {
  const cleanDocName = doctorName.replace(/^Dr\.\s*/, '');
  const cleanRepName = repName || 'Representative';
  const cleanCompany = companyName || 'Pharma';

  switch (context) {
    case 'rep_to_doctor_approved':
      return `Hello Dr. ${cleanDocName}, this is ${cleanRepName} from ${cleanCompany}. Regarding my visit on ${slotDate} at ${slotStart} (Gatepass #${token}).`;

    case 'rep_to_doctor_declined':
      return `Hello Dr. ${cleanDocName}, this is ${cleanRepName} from ${cleanCompany} regarding my request for ${slotDate}. Could I suggest another time?`;

    case 'rep_to_doctor_profile':
      return `Hello Dr. ${cleanDocName}, this is ${cleanRepName} from ${cleanCompany}. I would like to share information about ${productName || 'our products'}.`;

    case 'doctor_to_rep_cancelled':
      return `Hello ${cleanRepName}, Dr. ${cleanDocName} had to cancel the visit on ${slotDate} (${cancelReason || 'Clinic emergency'}). Please rebook another convenient slot on Gatepass.`;

    case 'doctor_to_rep_moved':
      return `Hello ${cleanRepName}, Dr. ${cleanDocName} has moved your visit to ${newSlotDate} at ${newSlotStart}. Please check your Gatepass pass.`;

    case 'doctor_to_rep_clear_day':
      return `Hello ${cleanRepName}, Dr. ${cleanDocName}'s clinic visits for today (${slotDate}) have been cancelled due to: ${cancelReason || 'emergency'}. Please pick another slot on Gatepass.`;

    default:
      return `Hello Dr. ${cleanDocName}, this is ${cleanRepName} from ${cleanCompany}.`;
  }
}
