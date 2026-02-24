import { Gender, getTitleDisplay } from './title-system';

export type NotificationType = 
  | 'welcome'
  | 'order_placed'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'payment_received'
  | 'payment_sent'
  | 'auction_won'
  | 'auction_outbid'
  | 'auction_ending'
  | 'verification_approved'
  | 'verification_rejected'
  | 'points_earned'
  | 'reward_unlocked'
  | 'message_received'
  | 'system';

interface NotificationTemplate {
  title: {
    male: string;
    female: string;
  };
  body: {
    male: string;
    female: string;
  };
  icon: string;
}

const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  welcome: {
    title: {
      male: 'مرحباً بك يا {}',
      female: 'مرحبتاً بك يا {}',
    },
    body: {
      male: 'سعداء بانضمامك إلى منصتنا! ابدأ الآن في بيع وشراء الخردة.',
      female: 'سعداءات بانضمامك إلى منصتنا! ابدئي الآن في بيع وشراء الخردة.',
    },
    icon: 'celebration',
  },
  order_placed: {
    title: {
      male: 'تم استلام طلبك يا {}',
      female: 'تم استلام طلبك يا {}',
    },
    body: {
      male: 'طلبك قيد المراجعة. سنخطرك عند التحديث.',
      female: 'طلبك قيد المراجعة. سنخطرك عند التحديث.',
    },
    icon: 'shopping_cart',
  },
  order_confirmed: {
    title: {
      male: 'تم تأكيد طلبك يا {}',
      female: 'تم تأكيد طلبك يا {}',
    },
    body: {
      male: 'طلبك تم تأكيده بنجاح!正在进行配送准备。',
      female: 'طلبك تم تأكيده بنجاح!正在进行配送准备。',
    },
    icon: 'check_circle',
  },
  order_shipped: {
    title: {
      male: 'تم شحن طلبك يا {}',
      female: 'تم شحن طلبك يا {}',
    },
    body: {
      male: 'طلبك في الطريق! تتبعه الآن.',
      female: 'طلبك في الطريق! تتبعيه الآن.',
    },
    icon: 'local_shipping',
  },
  order_delivered: {
    title: {
      male: 'تم توصيل طلبك يا {}',
      female: 'تم توصيل طلبك يا {}',
    },
    body: {
      male: 'شكراً لشرائك من منصتنا! لا تنسَ تقييم المنتج.',
      female: 'شكراً لشرائك من منصتنا! لا تنسي تقييم المنتج.',
    },
    icon: 'inventory_2',
  },
  payment_received: {
    title: {
      male: 'تم استلام الدفع يا {}',
      female: 'تم استلام الدفع يا {}',
    },
    body: {
      male: 'تم إيداع المبلغ في محفظتك بنجاح.',
      female: 'تم إيداع المبلغ في محفظتك بنجاح.',
    },
    icon: 'payments',
  },
  payment_sent: {
    title: {
      male: 'تم إرسال الدفع يا {}',
      female: 'تم إرسال الدفع يا {}',
    },
    body: {
      male: 'تم خصم المبلغ من محفظتك.',
      female: 'تم خصم المبلغ من محفظتك.',
    },
    icon: 'send',
  },
  auction_won: {
    title: {
      male: 'تهانينا يا {}!',
      female: 'تهانينا يا {}!',
    },
    body: {
      male: 'فزت بالمزاد! أكمل الدفع لإتمام الصفقة.',
      female: 'فزت بالمزاد! أكملي الدفع لإتمام الصفقة.',
    },
    icon: 'emoji_events',
  },
  auction_outbid: {
    title: {
      male: 'تم تجاوز سعرك يا {}',
      female: 'تم تجاوز سعرك يا {}',
    },
    body: {
      male: 'هناك عرض أعلى منك. هل تريد رفع السعر؟',
      female: 'هناك عرض أعلى منك. هل تريدين رفع السعر؟',
    },
    icon: 'gavel',
  },
  auction_ending: {
    title: {
      male: 'المزاد ينتهي قريباً يا {}',
      female: 'المزاد ينتهي قريباً يا {}',
    },
    body: {
      male: 'المزاد الذي تتابعه سينتهي خلال ساعة!',
      female: 'المزاد الذي تتابعينه سينتهي خلال ساعة!',
    },
    icon: 'schedule',
  },
  verification_approved: {
    title: {
      male: 'تم توثيق حسابك يا {}',
      female: 'تم توثيق حسابك يا {}',
    },
    body: {
      male: 'مبارك! حسابك الآن موثق. استمتع بجميع المميزات.',
      female: 'مبارك! حسابك الآن موثق. استمتعي بجميع المميزات.',
    },
    icon: 'verified_user',
  },
  verification_rejected: {
    title: {
      male: 'تم رفض توثيقك يا {}',
      female: 'تم رفض توثيقك يا {}',
    },
    body: {
      male: 'يرجى مراجعة причины الرفض وإعادة التقديم.',
      female: 'يرجى مراجعة причины الرفض وإعادة التقديم.',
    },
    icon: 'error',
  },
  points_earned: {
    title: {
      male: 'earned points {}',
      female: 'earned points {}',
    },
    body: {
      male: 'لديك {} نقاط جديدة! استبدلها بمكافآت.',
      female: 'لديك {} نقاط جديدة! استبدليها بمكافآت.',
    },
    icon: 'stars',
  },
  reward_unlocked: {
    title: {
      male: 'مكافأة جديدة لك يا {}',
      female: 'مكافأة جديدة لكِ يا {}',
    },
    body: {
      male: 'لقد فتحت مكافأة جديدة! راجعها الآن.',
      female: 'لقد فتحت مكافأة جديدة! راجعيها الآن.',
    },
    icon: 'card_giftcard',
  },
  message_received: {
    title: {
      male: 'لديك رسالة جديدة يا {}',
      female: 'لديك رسالة جديدة يا {}',
    },
    body: {
      male: 'تحقق من رسائلك الجديدة.',
      female: 'تحققي من رسائلك الجديدة.',
    },
    icon: 'chat',
  },
  system: {
    title: {
      male: 'إشعار的系统',
      female: 'إشعار的系统',
    },
    body: {
      male: 'لديك إشعار جديد من النظام.',
      female: 'لديك إشعار جديد من النظام.',
    },
    icon: 'notifications',
  },
};

export interface NotificationPayload {
  type: NotificationType;
  userName: string;
  userTitleId?: string;
  userGender?: Gender;
  data?: Record<string, string | number>;
}

export interface GeneratedNotification {
  title: string;
  body: string;
  icon: string;
  type: NotificationType;
  data?: Record<string, string | number>;
}

export function generateNotification(payload: NotificationPayload): GeneratedNotification {
  const template = NOTIFICATION_TEMPLATES[payload.type];
  
  if (!template) {
    return {
      title: 'إشعار',
      body: 'لديك إشعار جديد',
      icon: 'notifications',
      type: payload.type,
      data: payload.data,
    };
  }

  const gender = (payload.userGender === 'female' ? 'female' : 'male') as 'male' | 'female';
  const title = template.title[gender];
  const body = template.body[gender];

  const formatMessage = (message: string): string => {
    let formatted = message.replace('{}', payload.userName);
    
    if (payload.data) {
      Object.entries(payload.data).forEach(([key, value]) => {
        formatted = formatted.replace(`{${key}}`, String(value));
      });
    }
    
    return formatted;
  };

  return {
    title: formatMessage(title),
    body: formatMessage(body),
    icon: template.icon,
    type: payload.type,
    data: payload.data,
  };
}

export function useNotificationGenerator() {
  const generate = (payload: NotificationPayload): GeneratedNotification => {
    return generateNotification(payload);
  };

  return { generate };
}
