import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  bagListed: 'lastbag_milestone_bag_listed',
  orderReceived: 'lastbag_milestone_order_received',
  pickupConfirmed: 'lastbag_milestone_pickup_confirmed',
} as const;

export type PartnerMilestone = keyof typeof KEYS;

export async function shouldCelebrateMilestone(milestone: PartnerMilestone): Promise<boolean> {
  const seen = await AsyncStorage.getItem(KEYS[milestone]);
  return seen !== '1';
}

export async function markMilestoneCelebrated(milestone: PartnerMilestone) {
  await AsyncStorage.setItem(KEYS[milestone], '1');
}

export async function celebrateMilestoneOnce(milestone: PartnerMilestone): Promise<boolean> {
  const should = await shouldCelebrateMilestone(milestone);
  if (should) await markMilestoneCelebrated(milestone);
  return should;
}
