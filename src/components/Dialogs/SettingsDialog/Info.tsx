import * as React from 'react';
import styles from '@src/components/Dialogs/SettingsDialog/styles.less';
import Tooltip from '@src/components/Tooltip';

interface IProps {
    infoType: keyof TInfoData
}

type TDataItem = {
    title: string,
    text: string,
    more?: string
};

type TInfoData = {
    Mainnet: TDataItem,
    Testnet: TDataItem,
    Stagenet: TDataItem,
    NodeTimeout: TDataItem,
    TestTimeout: TDataItem
    DefaultAdditionalFee: TDataItem
};

const infoData: TInfoData = {
    Mainnet: {
        title: 'Mainnet',
        text: 'Mainnet – short for main network – is the original and functional blockchain where actual transactions' +
            ' take place in the distributed ledger and the native cryptocurrencies possess real economic value.',
        more: 'https://docs.wavesplatform.com/en/blockchain/mainnet.html'
    },
    Testnet: {
        title: 'Testnet',
        text: 'The testnet(test network) is an alternative Waves blockchain. It always has the same features as mainnet, and never rolls back. It is used for application testing',
        more: 'https://docs.wavesplatform.com/en/blockchain/test-network.html'
    },
    Stagenet: {
        title: 'Stagenet',
        text: 'The stagenet(stage network) is an alternative Waves blockchain. It is used to test new blockchain features. Rollbacks often occur on this chain',
        more: 'https://docs.wavesplatform.com/en/blockchain/test-network.html'
    },
    NodeTimeout: {
        title: 'Node Timeout',
        text: 'Default timeout for node request in milliseconds. E.g: how long we should wait for transaction via waitForTx function\.If set to 0, 20 seconds will be used',
        more: 'https://wavesplatform.github.io/waves-transactions/interfaces/nodeinteraction.inoderequestoptions.html'
    },
    TestTimeout: {
        title: 'Mocha async timeout',
        text: 'Default timeout for async tests. Use 0 for infinite timeout',
        more: 'https://mochajs.org/#timeouts'
    },
    DefaultAdditionalFee: {
        title: 'Default additional fee',
        text: 'Fee will be added to all transactions generated in IDE via UI, tests or console. E.g.: you can set it to 400000, so every new generated tx will be valid if send from scripted account',
    }
};

const Info = ({infoType}: IProps) =>
    <Tooltip placement="bottomLeft" trigger="hover" align={{offset: [-34, 0]}}
             overlay={<div>
                 <div className={styles.tooltip_title}>{infoData[infoType].title}</div>
                 <div className={styles.tooltip_text}>{infoData[infoType].text}</div>
                 {infoData[infoType].more &&
                 <a className={styles.tooltip_more} href={infoData[infoType].more} target="_blank">Show more</a>
                 }
             </div>
             }
    >
        <div className={styles.info}/>
    </Tooltip>;


export default Info;
