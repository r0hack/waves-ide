import React from 'react';
import { autorun, computed, IReactionDisposer, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import cn from 'classnames';

import { FILE_TYPE, FilesStore, ReplsStore, SettingsStore, TabsStore, UIStore } from '@stores';

import { IEventDisposer, mediator, testRunner } from '@services';

import { Repl } from '@components/Repl';
import Tabs, { TabPane } from 'rc-tabs';
import TabContent from 'rc-tabs/lib/TabContent';
import InkTabBar from 'rc-tabs/lib/InkTabBar';
import ReplTab from './ReplTab';


import styles from './styles.less';
import { IResizableProps, withResizableWrapper } from '@components/HOC/ResizableWrapper';
import Compilation from '@components/ReplsPanel/Compilation';
import Tests from '@components/ReplsPanel/Tests';

enum REPl_TYPE {
    TEST,
}

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

    private blockchainReplRef = React.createRef<Repl>();
    private testReplRef = React.createRef<Repl>();

    private consoleEnvUpdateDisposer?: IReactionDisposer;
    private testReplWriteDisposer?: IEventDisposer;
    private testReplClearDisposer?: IEventDisposer;

    private handleReplTabClick = (key: 'blockchainRepl' | 'compilationRepl' | 'testRepl') => () => {
        this.props.uiStore!.replsPanel.activeTab = key;
        if (!this.props.isOpened) this.props.handleExpand();
    };

    private getReplInstance = (type: REPl_TYPE) => {
        const TypeReplInstanceMap: { [type: number]: null | Repl } = {
            [REPl_TYPE.TEST]: this.testReplRef.current,
        };

        return TypeReplInstanceMap[type];
    };

    private writeToRepl = (type: REPl_TYPE, method: string, ...args: any[]) => {
        const replInstance = this.getReplInstance(type);


        replInstance && replInstance.methods[method](...args);
    };

    private clearRepl = (type: REPl_TYPE) => {
        const replInstance = this.getReplInstance(type);

        replInstance && replInstance.methods.clear();
    };

    private subscribeToComponentsMediator = () => {
        this.testReplWriteDisposer = mediator.subscribe(
            'testRepl => write',
            this.writeToRepl.bind(this, REPl_TYPE.TEST)
        );

        this.testReplClearDisposer = mediator.subscribe(
            'testRepl => clear',
            this.clearRepl.bind(this, REPl_TYPE.TEST)
        );
    };

    private unsubscribeToComponentsMediator = () => {
        this.testReplWriteDisposer && this.testReplWriteDisposer();
        this.testReplClearDisposer && this.testReplClearDisposer();
    };

    private createReactions = () => {
        const {settingsStore} = this.props;

        const blockchainReplInstance = this.blockchainReplRef.current;

        //consoleEnvUpdateReaction
        this.consoleEnvUpdateDisposer = autorun(() => {
            blockchainReplInstance && blockchainReplInstance.updateEnv(
                settingsStore!.consoleEnv
            );
        }, {name: 'consoleEnvUpdateReaction'});

    };

    private removeReactions = () => {
        this.consoleEnvUpdateDisposer && this.consoleEnvUpdateDisposer();
    };

    componentDidMount() {
        const getFileContent = this.props.filesStore!.getFileContent;
        const blockchainReplInstance = this.blockchainReplRef.current;

        this.subscribeToComponentsMediator();

        this.createReactions();

        blockchainReplInstance && blockchainReplInstance.updateEnv({
            file: getFileContent
        });

    }

    componentWillUnmount() {
        this.unsubscribeToComponentsMediator();

        this.removeReactions();
    }

    getCompilationReplLabel = () => (this.props.filesStore!.currentFileCompilationResult.length || 0).toString();
    getCompilationReplIsErrorLabel = () => this.props.filesStore!.currentFileCompilationResult.some(({type}) => type === 'error');

    getTestReplStatsLabel = () => `${testRunner.info.passes}/${testRunner.info.testsCount}`;

    getExpanderCn = () => cn(styles.expander, {[styles.expander__isOpened]: this.props.isOpened});

    render() {
        const filesStore = this.props.filesStore!;
        const uiStore = this.props.uiStore!;

        const compilationLabel = (filesStore.currentFileCompilationResult.length || 0).toString();
        const isCompilationError = filesStore.currentFileCompilationResult.some(({type}) => type === 'error');

        return (
            <div className={styles.root}>
                <div className={this.getExpanderCn()} onClick={this.props.handleExpand}/>

                <Tabs
                    activeKey={uiStore.replsPanel.activeTab}
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
                                theme={uiStore.editorSettings.isDarkTheme ? 'dark' : 'light'}
                            />
                        </div>
                    </TabPane>

                    <TabPane
                        forceRender={true}
                        key="compilationRepl"
                        tab={
                            <ReplTab
                                name={'Compilation'}
                                label={compilationLabel}
                                isError={isCompilationError}
                                onClick={this.handleReplTabClick('compilationRepl')}
                            />
                        }
                    >
                        <div className={cn(styles.repl, styles.repl__compilation)}>
                            <Compilation compilation={filesStore.currentFileCompilationResult}/>
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
                            <Tests testRef={this.testReplRef}/>
                        </div>
                    </TabPane>
                </Tabs>
            </div>
        );
    }
}

export default withResizableWrapper(ReplsPanel);
