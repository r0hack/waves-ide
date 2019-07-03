import React from 'react';
import { inject, observer } from 'mobx-react';

import Resizable, { ResizeCallback } from 're-resizable';

import { UIStore } from '@stores';

import styles from './styles.less';
import classNames from 'classnames';


const CLOSE_HEIGHT = 48;
const MIN_HEIGHT = 200;
const CLOSE_WIDTH = 24;
const MIN_WIDTH = 225;

const resizeEnableDirections = {
    top: false, right: false, bottom: false, left: false,
    topRight: false, bottomRight: false, bottomLeft: false, topLeft: false,
};

interface IState {
}

interface IResizableWrapperProps {
    uiStore?: UIStore,
    resizeSide: 'top' | 'right'
}

export interface IWrappedProps {
    isOpened: boolean
    handleExpand: () => void
}


export function withResizableWrapper<P extends IWrappedProps>(WrappedComponent: React.ComponentClass<P>){

    @inject('uiStore')
    @observer
    class AugmentedComponent extends React.Component< Omit<P, keyof IWrappedProps> & IResizableWrapperProps> {

        get minSize(): number {
            const {resizeSide} = this.props;
            if (resizeSide === 'top') return MIN_HEIGHT;
            if (resizeSide === 'right') return MIN_WIDTH;
            else return 0;
        }

        get closeSize(): number {
            const {resizeSide} = this.props;
            if (resizeSide === 'top') return CLOSE_HEIGHT;
            if (resizeSide === 'right') return CLOSE_WIDTH;
            else return 0;
        }

        get sizeParam(): ('height' | 'width') {
            return this.props.resizeSide === 'top' ? 'height' : 'width';
        }

        expand = () => {
            const {resizeSide} = this.props;
            const panel = this.props.uiStore!.resizables[resizeSide];
            const {size, isOpened} = panel;

            if (isOpened) {
                panel.isOpened = false;
            } else {
                let isSizeLessThanMinSize = size <= this.minSize;

                if (isSizeLessThanMinSize) {
                    panel.size = this.minSize;
                    panel.isOpened = true;
                } else {
                    panel.isOpened = true;
                }
            }
        };

        private handleResizeStop: ResizeCallback = (event, direction, elementRef, delta) => {
            const {resizeSide} = this.props;
            const panel = this.props.uiStore!.resizables[resizeSide];
            const {size, isOpened} = panel;

            const newSize = delta[this.sizeParam] + size;
            let isNewSizeLessThanMinSize = newSize <= this.minSize;

            if (isNewSizeLessThanMinSize) {
                if (isOpened) {
                    panel.size = this.closeSize;

                    panel.isOpened = false;
                } else {
                    panel.size = this.minSize;

                    panel.isOpened = true;
                }
            } else {
                panel.size = newSize;

                panel.isOpened = true;
            }
        };

        render() {
            const {resizeSide, uiStore,  ...rest} = this.props;
            const {size, isOpened} = uiStore!.resizables[resizeSide];
            let computedSize = isOpened ? size : this.closeSize;

            return (
                <Resizable
                    size={{[this.sizeParam]: computedSize}}
                    minHeight={resizeSide === 'top' ? this.closeSize : undefined}
                    minWidth={resizeSide === 'right' ? this.closeSize : undefined}
                    defaultSize={{[this.sizeParam]: this.minSize}}
                    enable={{...resizeEnableDirections, [resizeSide]: true}}
                    onResizeStop={this.handleResizeStop}
                    className={classNames(styles['resizable-' + resizeSide], styles.resizable)}
                    handleWrapperClass={styles['resizer-' + resizeSide]}

                >
                    <WrappedComponent isOpened={isOpened} handleExpand={this.expand}  {...rest as unknown as P}/>
                </Resizable>
            );
        }
    }

    return AugmentedComponent;
}

