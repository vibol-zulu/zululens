import { afterEach, expect, test } from 'bun:test';
import { featureDisabledEvent, notifyIfFeatureDisabled } from './temporarilyDisabledFeatures';

const originalWindow = globalThis.window;
afterEach(() => {
  globalThis.window = originalWindow;
});

for (const feature of [
  'estimate-audience', 'analyze-political-lean', 'discover-channels',
  'fetch-article', 'auto-fetch-news', 'populate-channel-profile',
]) {
  test(`${feature} is paused and announces the requested feature`, () => {
    const events = [];
    globalThis.window = { dispatchEvent: (event) => { events.push(event); return true; } };
    expect(notifyIfFeatureDisabled(feature)).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(featureDisabledEvent);
    expect(events[0].detail).toBe(feature);
  });
}