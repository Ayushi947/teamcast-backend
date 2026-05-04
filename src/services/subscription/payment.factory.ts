import { singleton } from '@/shared/decorators/singleton';
import { IPaymentProvider } from './payment.interface';
import { StripeProvider } from './stripe.provider';
import { DummyProvider } from './dummy.provider';
import { ENV } from '@/config/env';
import { logger } from '@/shared/utils/logger';
import { PaymentProviderEnum } from '@/shared/models/common/enums';

@singleton
export class PaymentFactory {
  /**
   * Get the appropriate payment provider based on configuration
   */
  getPaymentProvider(): IPaymentProvider {
    const providerType = ENV.PAYMENT_PROVIDER || PaymentProviderEnum.DUMMY;

    logger.info(`Initializing payment provider: ${providerType}`);

    switch (providerType.toLowerCase()) {
      case PaymentProviderEnum.STRIPE:
        return new StripeProvider();
      case PaymentProviderEnum.DUMMY:
        return new DummyProvider();
      // Add more providers as needed
      default:
        logger.warn(
          `Unknown payment provider: ${providerType}, using dummy provider`
        );
        return new DummyProvider();
    }
  }

  /**
   * Get the payment provider type
   */
  getPaymentProviderType(): PaymentProviderEnum {
    return (
      (ENV.PAYMENT_PROVIDER as PaymentProviderEnum) || PaymentProviderEnum.DUMMY
    );
  }

  getPaymentProviderByType(type: PaymentProviderEnum): IPaymentProvider {
    switch (type) {
      case PaymentProviderEnum.STRIPE:
        return new StripeProvider();
      case PaymentProviderEnum.DUMMY:
        return new DummyProvider();
      default:
        throw new Error(`Unknown payment provider type: ${type}`);
    }
  }
}
