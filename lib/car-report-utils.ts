import { checkItems } from './constants';

export function calculateReportStatus(metadata: any): 'good' | 'bad' {
  // Check if any boolean inspection item is false/inactive
  for (const item of checkItems) {
    if (metadata[item.key] === false) {
      return 'bad';
    }
  }

  // Check if there are any issues mentioned in paint and body
  if (metadata.paintAndBody && metadata.paintAndBody.trim() !== '') {
    return 'bad';
  }

  // Check if there are any events requiring reporting
  if (metadata.eventsObligatingReporting && metadata.eventsObligatingReporting.trim() !== '') {
    return 'bad';
  }

  // If all checks pass, status is good
  return 'good';
}