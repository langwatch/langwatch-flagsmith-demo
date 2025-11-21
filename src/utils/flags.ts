import { Flagsmith } from 'flagsmith-nodejs';

const flagsmith = new Flagsmith({
  environmentKey: process.env.FLAGSMITH_SERVER_KEY || 'ser.LqyzrPcXqZb9HLcHy92Zwb',
});

export const getFlags = async () => {
    try {
        const flags = await flagsmith.getEnvironmentFlags();
        return flags;
    } catch (error) {
        console.error('Error fetching flags:', error);
        return {
            isFeatureEnabled: () => false,
            getFeatureValue: () => null
        };
    }
}

export const isTransactionDisputeEnabled = async () => {
    const flags = await getFlags();
    return flags.isFeatureEnabled('transaction_dispute');
}
