'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { TitleSelector, GenderSelector } from '@/components/TitleSelector';
import { TitleBadge } from '@/components/TitleFormatter';
import { Gender, getTitleDisplay } from '@/lib/title-system';

const companyTypes = [
  { value: 'LLC', label: 'شركة ذات مسؤولية محدودة' },
  { value: 'SINGLE_PERSON_COMPANY', label: 'شركة الشخص الواحد' },
  { value: 'OFFSHORE_LLC', label: 'شركة محدودة المسؤولية خارجية (أوف شور)' },
  { value: 'PUBLIC_JOINT_STOCK', label: 'شركة مساهمة مغفلة عامة' },
  { value: 'PRIVATE_JOINT_STOCK', label: 'شركة مساهمة مغفلة خاصة' },
  { value: 'HOLDING_COMPANY', label: 'شركة مساهمة مغفلة قابضة' },
  { value: 'FACTORY', label: 'مصنع' },
  { value: 'COLLECTION_CENTER', label: 'مركز تجميع' },
  { value: 'OTHER', label: 'أخرى' },
];

const businessTypes = [
  { value: 'TRADER', label: 'تاجر خردة' },
  { value: 'SCRAP_COLLECTOR', label: 'جامع خردة' },
  { value: 'FACTORY_OWNER', label: 'صاحب مصنع' },
  { value: 'RECYCLER', label: 'معيد تدوير' },
  { value: 'BROKER', label: 'وسيط' },
  { value: 'EXPORTER', label: 'مصدر' },
  { value: 'IMPORTER', label: 'مستورد' },
  { value: 'OTHER', label: 'أخرى' },
];

const jobTitles = [
  { value: 'OWNER', label: 'صاحب الشركة / المالك' },
  { value: 'CEO', label: 'المدير التنفيذي' },
  { value: 'GM', label: 'المدير العام' },
  { value: 'PURCHASE_MANAGER', label: 'مدير المشتريات' },
  { value: 'SALES_MANAGER', label: 'مدير المبيعات' },
  { value: 'OPERATIONS_MANAGER', label: 'مدير العمليات' },
  { value: 'LOGISTICS_MANAGER', label: 'مدير اللوجستيات' },
  { value: 'EMPLOYEE', label: 'موظف' },
  { value: 'OTHER', label: 'أخرى' },
];

interface ProfileData {
  titleId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  companyName: string;
  companyType: string;
  companyTypeOther: string;
  businessType: string;
  businessTypeOther: string;
  jobTitle: string;
  jobTitleOther: string;
  bio: string;
}

export default function AccountSettingsPage() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'security'>('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  const [profile, setProfile] = useState<ProfileData>({
    titleId: '',
    firstName: '',
    lastName: '',
    gender: 'male',
    companyName: '',
    companyType: 'SINGLE_PERSON_COMPANY',
    companyTypeOther: '',
    businessType: 'TRADER',
    businessTypeOther: '',
    jobTitle: 'OWNER',
    jobTitleOther: '',
    bio: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    whatsapp: false,
    telegram: false,
    push: true,
    deals: true,
    auctions: true,
    marketing: false,
  });

  const [notificationContacts, setNotificationContacts] = useState({
    email: '',
    smsPhone: '',
    whatsappPhone: '',
    telegramUsername: '',
  });

  const [savedNotificationContacts, setSavedNotificationContacts] = useState({
    email: '',
    smsPhone: '',
    whatsappPhone: '',
    telegramUsername: '',
  });

  const [editingNotification, setEditingNotification] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState<'email' | 'phone' | null>(null);
  const [editStep, setEditStep] = useState(1);
  const [newContactValue, setNewContactValue] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms' | 'whatsapp' | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;
      
      setIsLoadingSettings(true);
      try {
        const response = await fetch(`/api/user/settings?userId=${user.id}`);
        const data = await response.json();
        
        if (data.success && data.user) {
          const u = data.user;
          setProfile({
            titleId: u.titleId || '',
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            gender: u.gender || 'male',
            companyName: u.companyName || '',
            companyType: u.companyType || 'SINGLE_PERSON_COMPANY',
            companyTypeOther: u.companyTypeOther || '',
            businessType: u.businessType || 'TRADER',
            businessTypeOther: u.businessTypeOther || '',
            jobTitle: u.jobTitle || 'OWNER',
            jobTitleOther: u.jobTitleOther || '',
            bio: u.bio || '',
          });
          
          setNotifications({
            email: u.notifEmail ?? true,
            sms: u.notifSms ?? false,
            whatsapp: u.notifWhatsapp ?? false,
            telegram: u.notifTelegram ?? false,
            push: u.notifPush ?? true,
            deals: u.notifDeals ?? true,
            auctions: u.notifAuctions ?? true,
            marketing: u.notifMarketing ?? false,
          });
          
          setNotificationContacts({
            email: u.email || '',
            smsPhone: u.smsPhone || '',
            whatsappPhone: u.whatsappPhone || '',
            telegramUsername: u.telegramUsername || '',
          });
          
          setSavedNotificationContacts({
            email: u.email || '',
            smsPhone: u.smsPhone || '',
            whatsappPhone: u.whatsappPhone || '',
            telegramUsername: u.telegramUsername || '',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    
    fetchSettings();
  }, [user?.id]);

  const handleTitleChange = (titleId: string, gender: Gender) => {
    setProfile({ ...profile, titleId, gender });
  };

  const handleSaveProfile = async () => {
    if (!profile.firstName || !profile.lastName) {
      addToast('يرجى إدخال الاسم الكامل', 'error');
      return;
    }

    if (!user?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          titleId: profile.titleId,
          gender: profile.gender,
          bio: profile.bio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل حفظ التغييرات');
      }

      await updateUser({
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        firstName: profile.firstName,
        lastName: profile.lastName,
        titleId: profile.titleId,
        gender: profile.gender,
      });

      addToast('تم حفظ التغييرات بنجاح', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ';
      addToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusinessInfo = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          companyName: profile.companyName,
          companyType: profile.companyType,
          companyTypeOther: profile.companyTypeOther,
          businessType: profile.businessType,
          businessTypeOther: profile.businessTypeOther,
          jobTitle: profile.jobTitle,
          jobTitleOther: profile.jobTitleOther,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل حفظ التغييرات');
      }

      addToast('تم حفظ معلومات النشاط التجاري بنجاح', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ';
      addToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotificationContact = async (type: 'email' | 'sms' | 'whatsapp' | 'telegram') => {
    if (!user?.id) return;

    const key = type === 'email' ? 'email' : type === 'sms' ? 'smsPhone' : type === 'whatsapp' ? 'whatsappPhone' : 'telegramUsername';
    const value = notificationContacts[key];

    const response = await fetch('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        ...notificationContacts,
      }),
    });

    if (response.ok) {
      setSavedNotificationContacts({ ...savedNotificationContacts, [key]: value });
      setEditingNotification(null);
      addToast('تم الحفظ بنجاح', 'success');
    }
  };

  const handleSaveNotifications = async () => {
    if (!user?.id) return;

    const response = await fetch('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        notifEmail: notifications.email,
        notifSms: notifications.sms,
        notifWhatsapp: notifications.whatsapp,
        notifTelegram: notifications.telegram,
        notifPush: notifications.push,
        notifDeals: notifications.deals,
        notifAuctions: notifications.auctions,
        notifMarketing: notifications.marketing,
        smsPhone: notificationContacts.smsPhone,
        whatsappPhone: notificationContacts.whatsappPhone,
        telegramUsername: notificationContacts.telegramUsername,
      }),
    });

    if (response.ok) {
      addToast('تم حفظ إعدادات الإشعارات', 'success');
    }
  };

  const handleSendVerificationCode = async () => {
    if (!user?.id || !showEditModal || !newContactValue || !verificationMethod) return;

    setIsSendingCode(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: showEditModal,
          newValue: newContactValue,
          verificationMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل إرسال رمز التحقق');
      }

      addToast(data.message, 'success');
      setEditStep(3);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ';
      addToast(message, 'error');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyAndUpdate = async () => {
    if (!user?.id || !showEditModal || !newContactValue || verificationCode.length !== 6) return;

    setIsVerifying(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: showEditModal,
          newValue: newContactValue,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل التحقق');
      }

      addToast(data.message, 'success');
      
      if (showEditModal === 'email') {
        await updateUser({ email: newContactValue });
      } else {
        await updateUser({ phone: newContactValue });
      }
      
      setShowEditModal(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ';
      addToast(message, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const getFullNameWithTitle = () => {
    const title = profile.titleId ? getTitleDisplay(profile.titleId, profile.gender) : '';
    const name = `${profile.firstName} ${profile.lastName}`.trim();
    if (!title) return name;
    if (name.startsWith(title)) return name.replace(title, '').trim();
    return name;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-dark">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-dark px-6">
        <span className="material-symbols-outlined text-primary !text-[64px] mb-4">lock</span>
        <h2 className="text-xl font-bold text-white mb-2">تسجيل الدخول مطلوب</h2>
        <p className="text-slate-400 mb-6">يرجى تسجيل الدخول للوصول لإعدادات الحساب</p>
        <Link href="/login" className="px-6 py-3 bg-primary text-white rounded-xl font-bold">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <Link href="/profile" className="size-10 rounded-full hover:bg-surface-highlight flex items-center justify-center">
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </Link>
          <h1 className="text-base font-bold text-white">إعدادات الحساب</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24">
        {/* User Preview Card */}
        <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-primary !text-[32px]">person</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {profile.titleId && (
                  <TitleBadge titleId={profile.titleId} gender={profile.gender} size="sm" />
                )}
                <h2 className="text-lg font-bold text-white">
                  {getFullNameWithTitle() || 'مستخدم'}
                </h2>
              </div>
              <p className="text-sm text-slate-400">{user?.email || user?.phone}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'personal', label: 'البيانات الشخصية', icon: 'person' },
            { id: 'business', label: 'النشاط التجاري', icon: 'business' },
            { id: 'security', label: 'الأمان', icon: 'security' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-surface-highlight text-slate-400 border border-slate-700 hover:border-primary/50'
                }
              `}
            >
              <span className="material-symbols-outlined !text-[18px]">{tab.icon}</span>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                المعلومات الشخصية
              </h3>

              <TitleSelector
                value={profile.titleId}
                onChange={handleTitleChange}
                label="اللقب"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">الاسم الأول</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">اسم العائلة</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <GenderSelector
                value={profile.gender}
                onChange={(g) => setProfile({ ...profile, gender: g })}
                label="الجنس"
                required
              />

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">البريد الإلكتروني</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="flex-1 bg-surface-dark/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-400 cursor-not-allowed"
                  />
                  <button
                    onClick={() => {
                      setShowEditModal('email');
                      setEditStep(1);
                      setNewContactValue('');
                      setVerificationMethod(null);
                      setVerificationCode('');
                    }}
                    className="px-4 py-2.5 bg-surface-dark border border-slate-600 text-white rounded-lg text-sm hover:border-primary transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined !text-[18px]">edit</span>
                    تعديل
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">رقم الهاتف</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={user?.phone || ''}
                    disabled
                    className="flex-1 bg-surface-dark/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-400 cursor-not-allowed"
                    dir="ltr"
                  />
                  <button
                    onClick={() => {
                      setShowEditModal('phone');
                      setEditStep(1);
                      setNewContactValue('');
                      setVerificationMethod(null);
                      setVerificationCode('');
                    }}
                    className="px-4 py-2.5 bg-surface-dark border border-slate-600 text-white rounded-lg text-sm hover:border-primary transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined !text-[18px]">edit</span>
                    تعديل
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">نبذة عنك</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="اكتب نبذة قصيرة عنك..."
                  rows={3}
                  className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        )}

        {/* Business Tab */}
        {activeTab === 'business' && (
          <div className="space-y-4">
            <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">store</span>
                معلومات النشاط التجاري
              </h3>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">اسم الشركة / المنشأة</label>
                <input
                  type="text"
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  placeholder="أدخل اسم الشركة"
                  className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">نوع النشاط</label>
                <select
                  value={profile.companyType}
                  onChange={(e) => setProfile({ ...profile, companyType: e.target.value })}
                  className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:border-primary focus:outline-none"
                >
                  {companyTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {profile.companyType === 'OTHER' && (
                  <input
                    type="text"
                    value={profile.companyTypeOther}
                    onChange={(e) => setProfile({ ...profile, companyTypeOther: e.target.value })}
                    placeholder="أدخل نوع النشاط"
                    className="w-full mt-2 bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">نشاطك التجاري</label>
                <select
                  value={profile.businessType}
                  onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                  className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:border-primary focus:outline-none"
                >
                  {businessTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {profile.businessType === 'OTHER' && (
                  <input
                    type="text"
                    value={profile.businessTypeOther}
                    onChange={(e) => setProfile({ ...profile, businessTypeOther: e.target.value })}
                    placeholder="أدخل نشاطك التجاري"
                    className="w-full mt-2 bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">المسمى الوظيفي</label>
                <select
                  value={profile.jobTitle}
                  onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                  className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:border-primary focus:outline-none"
                >
                  {jobTitles.map((title) => (
                    <option key={title.value} value={title.value}>{title.label}</option>
                  ))}
                </select>
                {profile.jobTitle === 'OTHER' && (
                  <input
                    type="text"
                    value={profile.jobTitleOther}
                    onChange={(e) => setProfile({ ...profile, jobTitleOther: e.target.value })}
                    placeholder="أدخل المسمى الوظيفي"
                    className="w-full mt-2 bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                  />
                )}
              </div>
            </div>

            <button
              onClick={handleSaveBusinessInfo}
              disabled={isSaving}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">notifications</span>
                إعدادات الإشعارات
              </h3>

              <div className="space-y-3">
                {[
                  { key: 'email', label: 'إشعارات البريد الإلكتروني', desc: 'تلقي التحديثات عبر البريد' },
                  { key: 'sms', label: 'إشعارات SMS', desc: 'تلقي رسائل نصية' },
                  { key: 'whatsapp', label: 'إشعارات واتساب', desc: 'تلقي رسائل عبر واتساب' },
                  { key: 'telegram', label: 'إشعارات تليجرام', desc: 'تلقي رسائل عبر تليجرام' },
                  { key: 'push', label: 'إشعارات_push', desc: 'إشعارات فورية' },
                  { key: 'deals', label: 'إشعارات الصفقات', desc: 'تحديثات الصفقات' },
                  { key: 'auctions', label: 'إشعارات المزادات', desc: 'عروض ومزادات جديدة' },
                  { key: 'marketing', label: 'العروض التسويقية', desc: 'عروض وأخبار خاصة' },
                ].map((item) => {
                  const isContactField = ['email', 'sms', 'whatsapp', 'telegram'].includes(item.key);
                  const savedKey = item.key === 'email' ? 'email' : item.key === 'sms' ? 'smsPhone' : item.key === 'whatsapp' ? 'whatsappPhone' : 'telegramUsername';
                  const isSaved = savedNotificationContacts[savedKey as keyof typeof savedNotificationContacts];
                  const isEditing = editingNotification === item.key;
                  
                  return (
                    <div key={item.key}>
                      <label className="flex items-center justify-between p-3 bg-surface-dark rounded-xl cursor-pointer hover:bg-surface-dark/80 transition">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-white font-medium text-sm">{item.label}</p>
                            <p className="text-slate-500 text-xs">{item.desc}</p>
                          </div>
                          {isContactField && isSaved && !isEditing && (
                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                              مفعل
                            </span>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) => {
                            setNotifications({ ...notifications, [item.key]: e.target.checked });
                            if (!e.target.checked && isContactField) {
                              setEditingNotification(null);
                            }
                          }}
                          className="w-5 h-5 rounded text-primary focus:ring-primary"
                        />
                      </label>
                      
                      {item.key === 'email' && notifications.email && (!isSaved || isEditing) && (
                        <div className="mt-2 px-3 space-y-2">
                          <input
                            type="email"
                            value={notificationContacts.email}
                            onChange={(e) => setNotificationContacts({ ...notificationContacts, email: e.target.value })}
                            placeholder="أدخل البريد الإلكتروني"
                            dir="ltr"
                            className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              setSavedNotificationContacts({ ...savedNotificationContacts, email: notificationContacts.email });
                              setEditingNotification(null);
                              addToast('تم حفظ البريد الإلكتروني بنجاح', 'success');
                            }}
                            className="w-full py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition"
                          >
                            حفظ البريد
                          </button>
                        </div>
                      )}
                      
                      {item.key === 'email' && notifications.email && isSaved && !isEditing && (
                        <div className="mt-2 px-3 flex gap-2">
                          <div className="flex-1 bg-surface-dark border border-slate-600 rounded-lg px-3 py-2 text-slate-400 text-sm truncate" dir="ltr">
                            {savedNotificationContacts.email}
                          </div>
                          <button
                            onClick={() => setEditingNotification('email')}
                            className="px-4 py-2 bg-surface-dark border border-slate-600 text-white rounded-lg text-sm hover:border-primary transition"
                          >
                            تعديل
                          </button>
                        </div>
                      )}
                      
                      {item.key === 'sms' && notifications.sms && (!isSaved || isEditing) && (
                        <div className="mt-2 px-3 space-y-2">
                          <input
                            type="tel"
                            value={notificationContacts.smsPhone}
                            onChange={(e) => setNotificationContacts({ ...notificationContacts, smsPhone: e.target.value })}
                            placeholder="أدخل رقم الهاتف لاستلام SMS"
                            dir="ltr"
                            className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              setSavedNotificationContacts({ ...savedNotificationContacts, smsPhone: notificationContacts.smsPhone });
                              setEditingNotification(null);
                              addToast('تم حفظ رقم SMS بنجاح', 'success');
                            }}
                            className="w-full py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition"
                          >
                            حفظ الرقم
                          </button>
                        </div>
                      )}
                      
                      {item.key === 'sms' && notifications.sms && isSaved && !isEditing && (
                        <div className="mt-2 px-3 flex gap-2">
                          <div className="flex-1 bg-surface-dark border border-slate-600 rounded-lg px-3 py-2 text-slate-400 text-sm" dir="ltr">
                            {savedNotificationContacts.smsPhone}
                          </div>
                          <button
                            onClick={() => setEditingNotification('sms')}
                            className="px-4 py-2 bg-surface-dark border border-slate-600 text-white rounded-lg text-sm hover:border-primary transition"
                          >
                            تعديل
                          </button>
                        </div>
                      )}
                      
                      {item.key === 'whatsapp' && notifications.whatsapp && (!isSaved || isEditing) && (
                        <div className="mt-2 px-3 space-y-2">
                          <input
                            type="tel"
                            value={notificationContacts.whatsappPhone}
                            onChange={(e) => setNotificationContacts({ ...notificationContacts, whatsappPhone: e.target.value })}
                            placeholder="أدخل رقم واتساب"
                            dir="ltr"
                            className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              setSavedNotificationContacts({ ...savedNotificationContacts, whatsappPhone: notificationContacts.whatsappPhone });
                              setEditingNotification(null);
                              addToast('تم حفظ رقم واتساب بنجاح', 'success');
                            }}
                            className="w-full py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition"
                          >
                            حفظ الرقم
                          </button>
                        </div>
                      )}
                      
                      {item.key === 'whatsapp' && notifications.whatsapp && isSaved && !isEditing && (
                        <div className="mt-2 px-3 flex gap-2">
                          <div className="flex-1 bg-surface-dark border border-slate-600 rounded-lg px-3 py-2 text-slate-400 text-sm" dir="ltr">
                            {savedNotificationContacts.whatsappPhone}
                          </div>
                          <button
                            onClick={() => setEditingNotification('whatsapp')}
                            className="px-4 py-2 bg-surface-dark border border-slate-600 text-white rounded-lg text-sm hover:border-primary transition"
                          >
                            تعديل
                          </button>
                        </div>
                      )}
                      
                      {item.key === 'telegram' && notifications.telegram && (!isSaved || isEditing) && (
                        <div className="mt-2 px-3 space-y-2">
                          <input
                            type="text"
                            value={notificationContacts.telegramUsername}
                            onChange={(e) => setNotificationContacts({ ...notificationContacts, telegramUsername: e.target.value })}
                            placeholder="أدخل اسم المستخدم في تليجرام (مثل: @username)"
                            dir="ltr"
                            className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              setSavedNotificationContacts({ ...savedNotificationContacts, telegramUsername: notificationContacts.telegramUsername });
                              setEditingNotification(null);
                              addToast('تم حفظ اسم مستخدم تليجرام بنجاح', 'success');
                            }}
                            className="w-full py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition"
                          >
                            حفظ
                          </button>
                        </div>
                      )}
                      
                      {item.key === 'telegram' && notifications.telegram && isSaved && !isEditing && (
                        <div className="mt-2 px-3 flex gap-2">
                          <div className="flex-1 bg-surface-dark border border-slate-600 rounded-lg px-3 py-2 text-slate-400 text-sm" dir="ltr">
                            {savedNotificationContacts.telegramUsername}
                          </div>
                          <button
                            onClick={() => setEditingNotification('telegram')}
                            className="px-4 py-2 bg-surface-dark border border-slate-600 text-white rounded-lg text-sm hover:border-primary transition"
                          >
                            تعديل
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface-highlight border border-slate-700 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">password</span>
                تغيير كلمة المرور
              </h3>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">كلمة المرور الحالية</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-surface-dark border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                />
              </div>

              <button className="w-full py-3 bg-surface-dark border border-slate-600 text-white rounded-xl font-bold hover:bg-surface-dark/80 transition">
                تغيير كلمة المرور
              </button>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
              <h3 className="text-red-500 font-bold flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined">dangerous</span>
                منطقة الخطر
              </h3>
              <button className="w-full py-3 bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl font-bold hover:bg-red-500/30 transition">
                حذف الحساب نهائياً
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Edit Contact Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-dark border border-slate-700 rounded-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">
                {showEditModal === 'email' ? 'تغيير البريد الإلكتروني' : 'تغيير رقم الهاتف'}
              </h3>
              <button
                onClick={() => setShowEditModal(null)}
                className="size-8 rounded-full hover:bg-surface-highlight flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Step 1: Enter new value */}
              {editStep === 1 && (
                <>
                  <p className="text-sm text-slate-400">
                    أدخل {showEditModal === 'email' ? 'البريد الإلكتروني الجديد' : 'رقم الهاتف الجديد'}
                  </p>
                  <input
                    type={showEditModal === 'email' ? 'email' : 'tel'}
                    value={newContactValue}
                    onChange={(e) => setNewContactValue(e.target.value)}
                    placeholder={showEditModal === 'email' ? 'example@email.com' : '+963 9XX XXX XXX'}
                    dir="ltr"
                    className="w-full bg-surface-highlight border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={() => setEditStep(2)}
                    disabled={!newContactValue}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </>
              )}

              {/* Step 2: Choose verification method */}
              {editStep === 2 && (
                <>
                  <p className="text-sm text-slate-400">
                    اختر طريقة التحقق لتأكيد هويتك
                  </p>
                  <div className="space-y-2">
                    {showEditModal === 'email' ? (
                      <>
                        <button
                          onClick={() => setVerificationMethod('email')}
                          className={`w-full p-3 rounded-xl border transition flex items-center gap-3 ${
                            verificationMethod === 'email' 
                              ? 'border-primary bg-primary/10' 
                              : 'border-slate-600 hover:border-primary/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-primary">mail</span>
                          <div className="text-right">
                            <p className="text-white font-medium text-sm">التحقق عبر البريد الحالي</p>
                            <p className="text-slate-500 text-xs">{user?.email}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setVerificationMethod('sms')}
                          className={`w-full p-3 rounded-xl border transition flex items-center gap-3 ${
                            verificationMethod === 'sms' 
                              ? 'border-primary bg-primary/10' 
                              : 'border-slate-600 hover:border-primary/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-primary">sms</span>
                          <div className="text-right">
                            <p className="text-white font-medium text-sm">التحقق عبر SMS</p>
                            <p className="text-slate-500 text-xs">{user?.phone}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setVerificationMethod('whatsapp')}
                          className={`w-full p-3 rounded-xl border transition flex items-center gap-3 ${
                            verificationMethod === 'whatsapp' 
                              ? 'border-primary bg-primary/10' 
                              : 'border-slate-600 hover:border-primary/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-green-500">chat</span>
                          <div className="text-right">
                            <p className="text-white font-medium text-sm">التحقق عبر واتساب</p>
                            <p className="text-slate-500 text-xs">{user?.phone}</p>
                          </div>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setVerificationMethod('email')}
                          className={`w-full p-3 rounded-xl border transition flex items-center gap-3 ${
                            verificationMethod === 'email' 
                              ? 'border-primary bg-primary/10' 
                              : 'border-slate-600 hover:border-primary/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-primary">mail</span>
                          <div className="text-right">
                            <p className="text-white font-medium text-sm">التحقق عبر البريد الإلكتروني</p>
                            <p className="text-slate-500 text-xs">{user?.email}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setVerificationMethod('sms')}
                          className={`w-full p-3 rounded-xl border transition flex items-center gap-3 ${
                            verificationMethod === 'sms' 
                              ? 'border-primary bg-primary/10' 
                              : 'border-slate-600 hover:border-primary/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-primary">sms</span>
                          <div className="text-right">
                            <p className="text-white font-medium text-sm">التحقق عبر SMS للرقم الحالي</p>
                            <p className="text-slate-500 text-xs">{user?.phone}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setVerificationMethod('whatsapp')}
                          className={`w-full p-3 rounded-xl border transition flex items-center gap-3 ${
                            verificationMethod === 'whatsapp' 
                              ? 'border-primary bg-primary/10' 
                              : 'border-slate-600 hover:border-primary/50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-green-500">chat</span>
                          <div className="text-right">
                            <p className="text-white font-medium text-sm">التحقق عبر واتساب</p>
                            <p className="text-slate-500 text-xs">{user?.phone}</p>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditStep(1)}
                      className="flex-1 py-3 bg-surface-highlight border border-slate-600 text-white rounded-xl font-bold hover:bg-surface-dark transition"
                    >
                      السابق
                    </button>
                    <button
                      onClick={handleSendVerificationCode}
                      disabled={!verificationMethod || isSendingCode}
                      className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSendingCode ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          جاري الإرسال...
                        </>
                      ) : (
                        'إرسال رمز التحقق'
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Enter verification code */}
              {editStep === 3 && (
                <>
                  <p className="text-sm text-slate-400">
                    تم إرسال رمز التحقق عبر {
                      verificationMethod === 'email' ? 'البريد الإلكتروني' :
                      verificationMethod === 'sms' ? 'SMS' : 'واتساب'
                    }
                  </p>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                    dir="ltr"
                    className="w-full bg-surface-highlight border border-slate-600 rounded-lg px-3 py-2.5 text-white text-center text-lg tracking-widest placeholder-slate-500 focus:border-primary focus:outline-none"
                    maxLength={6}
                  />
                  <button
                    onClick={handleSendVerificationCode}
                    className="w-full text-sm text-primary hover:underline"
                  >
                    إعادة إرسال الرمز
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditStep(2)}
                      className="flex-1 py-3 bg-surface-highlight border border-slate-600 text-white rounded-xl font-bold hover:bg-surface-dark transition"
                    >
                      السابق
                    </button>
                    <button
                      onClick={handleVerifyAndUpdate}
                      disabled={verificationCode.length !== 6 || isVerifying}
                      className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          جاري التحقق...
                        </>
                      ) : (
                        'تأكيد التغيير'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
