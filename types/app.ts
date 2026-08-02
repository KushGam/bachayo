import type { Order, Partner, Profile, RescueBag, Review } from './database';

export type RescueBagWithPartner = RescueBag & {
  partner: Partner;
};

export type OrderWithBagAndPartner = Order & {
  bag: RescueBag;
  partner: Partner;
};

export type CustomerOrderWithDetails = Order & {
  partner: Partner;
  bag: RescueBag;
  review: Review | null;
};

export type PartnerOrderWithCustomer = Order & {
  bag: RescueBag;
  customer:
    | (Pick<Profile, 'id' | 'full_name' | 'phone'> & {
        privacy_settings?: Profile['privacy_settings'];
      })
    | null;
};

export type PartnerWithStats = Partner & {
  today_bag_count: number;
};
