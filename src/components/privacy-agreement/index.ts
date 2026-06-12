
import { storage, PRIVACY_AGREED } from '../../utils/storage';

interface PrivacyAgreementData {
  showAgreement: boolean;
  agreeing: boolean;
}

Component({
  options: { styleIsolation: 'isolated' },

  data: {
    showAgreement: false,
    agreeing: false,
  } as PrivacyAgreementData,

  lifetimes: {
    attached() {
      const agreed = storage.get<boolean>(PRIVACY_AGREED);
      if (!agreed) {
        this.setData({ showAgreement: true });
      }
    },
  },

  methods: {
    onAgree() {
      if (this.data.agreeing) return;
      this.setData({ agreeing: true });
      storage.set(PRIVACY_AGREED, true);
      this.setData({ showAgreement: false, agreeing: false });
    },
  },
});
