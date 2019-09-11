import React from 'react';
import { autorun, IReactionDisposer, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import cn from 'classnames';

import { FILE_TYPE, FilesStore, ReplsStore, SettingsStore, TabsStore, UIStore } from '@stores';

import { testRunner } from '@services';

import { Repl } from '@components/Repl';
import Tabs, { TabPane } from 'rc-tabs';
import TabContent from 'rc-tabs/lib/TabContent';
import InkTabBar from 'rc-tabs/lib/InkTabBar';
import ReplTab from './ReplTab';


import styles from './styles.less';
import { IResizableProps, withResizableWrapper } from '@components/HOC/ResizableWrapper';
import Compilation from '@components/ReplsPanel/Compilation';
import Tests from '@components/ReplsPanel/Tests';

interface IInjectedProps {
    filesStore?: FilesStore
    replsStore?: ReplsStore
    tabsStore?: TabsStore
    settingsStore?: SettingsStore,
    uiStore?: UIStore
}

interface IProps extends IInjectedProps, IResizableProps {
}

@inject('filesStore', 'settingsStore', 'replsStore', 'uiStore', 'tabsStore')
@observer
class ReplsPanel extends React.Component<IProps> {
    @observable
    private compilation: { type: 'error' | 'success', message: string }[] = [];

    private blockchainReplRef = React.createRef<Repl>();

    private consoleEnvUpdateDisposer?: IReactionDisposer;
    private compilationReplWriteDisposer?: IReactionDisposer;

    private handleReplTabClick = (key: 'blockchainRepl' | 'compilationRepl' | 'testRepl') => () => {
        this.props.uiStore!.replsPanel.activeTab = key;
        if (!this.props.isOpened) this.props.handleExpand();
    };

    private createReactions = () => {
        const {settingsStore, filesStore} = this.props;

        const blockchainReplInstance = this.blockchainReplRef.current;

        //consoleEnvUpdateReaction
        this.consoleEnvUpdateDisposer = autorun(() => {
            blockchainReplInstance && blockchainReplInstance.updateEnv(
                settingsStore!.consoleEnv
            );
        }, {name: 'consoleEnvUpdateReaction'});

        //compilationReplWriteReaction
        this.compilationReplWriteDisposer = autorun(() => {
            const file = filesStore!.currentFile;

            if (file && file.type !== FILE_TYPE.MARKDOWN && file.info) {
                if ('error' in file.info.compilation) {
                    this.compilation.length = 0;
                    this.compilation.push({type: 'error', message: file.info.compilation.error});

                } else {
                    this.compilation.length = 0;
                    this.compilation.push({type: 'success', message: `${file.name} file compiled successfully`});
                    'complexity' in file.info.compilation.result && this.compilation.push({
                        type: 'success',
                        message: `Script complexity ${file.info.compilation.result.complexity}`
                    });
                }
            }
        }, {name: 'compilationReplWriteReaction'});
    };

    private removeReactions = () => {
        this.consoleEnvUpdateDisposer && this.consoleEnvUpdateDisposer();
        this.compilationReplWriteDisposer && this.compilationReplWriteDisposer();
    };

    componentDidMount() {
        const getFileContent = this.props.filesStore!.getFileContent;
        const blockchainReplInstance = this.blockchainReplRef.current;

        this.createReactions();

        blockchainReplInstance && blockchainReplInstance.updateEnv({
            file: getFileContent
        });

    }

    componentWillUnmount() {
        this.removeReactions();
    }

    getCompilationReplLabel = () => (this.compilation.length || 0).toString();

    getCompilationReplIsErrorLabel = () => this.compilation.some(({type}) => type === 'error');

    getTestReplStatsLabel = () => `${testRunner.info.passes}/${testRunner.info.testsCount}`;

    getExpanderCn = () => cn(styles.expander, {[styles.expander__isOpened]: this.props.isOpened});

    render() {
        return (
            <div className={styles.root}>
                <div className={this.getExpanderCn()} onClick={this.props.handleExpand}/>

                <Tabs
                    activeKey={this.props.uiStore!.replsPanel.activeTab}
                    renderTabBar={() => <InkTabBar/>}
                    renderTabContent={() => <TabContent/>}
                >
                    <TabPane
                        forceRender={true}
                        key="blockchainRepl"
                        tab={
                            <ReplTab
                                name={'Console'}
                                onClick={this.handleReplTabClick('blockchainRepl')}
                            />
                        }
                    >
                        <div className={cn(styles.repl, styles.repl__blockchain)}>
                            <Repl
                                ref={this.blockchainReplRef}
                                theme={this.props.uiStore!.editorSettings.isDarkTheme ? 'dark' : 'light'}
                            />
                        </div>
                    </TabPane>

                    <TabPane
                        forceRender={true}
                        key="compilationRepl"
                        tab={
                            <ReplTab
                                name={'Compilation'}
                                label={this.getCompilationReplLabel()}
                                isError={this.getCompilationReplIsErrorLabel()}
                                onClick={this.handleReplTabClick('compilationRepl')}
                            />
                        }
                    >
                        <div className={cn(styles.repl, styles.repl__compilation)}>
                            <Compilation compilation={this.compilation}/>
                        </div>
                    </TabPane>

                    <TabPane
                        forceRender={true}
                        key="testRepl"
                        tab={
                            <ReplTab
                                name={'Tests'}
                                label={this.getTestReplStatsLabel()}
                                onClick={this.handleReplTabClick('testRepl')}
                            />
                        }
                    >
                        <div className={cn(styles.repl, styles.repl__test)}>
                            <Tests/>
                        </div>
                    </TabPane>
                </Tabs>
            </div>
        );
    }
}

export default withResizableWrapper(ReplsPanel);
