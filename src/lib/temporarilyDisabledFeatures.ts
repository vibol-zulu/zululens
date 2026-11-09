export const disabledFeatures = {
  'estimate-audience': 'Audience and political-lean analysis',
  'analyze-political-lean': 'Political-lean analysis',
  'discover-channels': 'Channel discovery',
  'fetch-article': 'Article fetching',
  'auto-fetch-news': 'Automatic news fetching',
  'populate-channel-profile': 'Automatic channel profiles',
} as const;

export type DisabledFeature = keyof typeof disabledFeatures;
export const featureDisabledEvent = 'zululens:feature-temporarily-disabled';

// Keep this guard before loading states, authentication, or external requests.
export function notifyIfFeatureDisabled(feature: DisabledFeature): boolean {
  window.dispatchEvent(new CustomEvent(featureDisabledEvent, { detail: feature }));
  return true;
}