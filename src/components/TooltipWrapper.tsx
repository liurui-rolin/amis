/**
 * @file TooltipWrapper
 * @description
 * @author fex
 */

import React = require('react');
import {Overlay} from 'react-overlays';
import Html from './Html';
import uncontrollable = require('uncontrollable');
import {findDOMNode} from 'react-dom';
import Tooltip from './Tooltip';
import {ClassNamesFn, themeable} from '../theme';

export interface TooltipObject {
    title?: string;
    content?: string;
}

export type Trigger = 'hover' | 'click' | 'focus';

export interface TooltipWrapperProps {
    classPrefix: string;
    classnames: ClassNamesFn;
    placement: 'top' | 'right' | 'bottom' | 'left';
    tooltip?: string | TooltipObject;
    container?: React.ReactNode;
    trigger: Trigger | Array<Trigger>;
    rootClose: boolean;
    overlay?: any;
    delay: number;
    theme?: string;
}

interface TooltipWrapperState {
    show?: boolean;
}

let waitToHide: Function | null = null;

export class TooltipWrapper extends React.Component<TooltipWrapperProps, TooltipWrapperState> {
    static defaultProps: Pick<TooltipWrapperProps, 'placement' | 'trigger' | 'rootClose' | 'delay'> = {
        placement: 'top',
        trigger: ['hover', 'focus'],
        rootClose: false,
        delay: 200
    };

    target: HTMLElement;
    timer: number;
    constructor(props: TooltipWrapperProps) {
        super(props);

        this.targetRef = this.targetRef.bind(this);
        this.getTarget = this.getTarget.bind(this);
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.handleShow = this.handleShow.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);

        this.state = {
            show: false
        };
    }

    componentWillUnmount() {
        clearTimeout(this.timer);
    }

    getTarget() {
        return this.target ? findDOMNode(this.target) : null;
    }

    targetRef(ref: HTMLElement) {
        this.target = ref;
    }

    show() {
        this.setState({
            show: true
        });
    }

    hide() {
        waitToHide = null;
        this.setState({
            show: false
        });
    }

    getChildProps() {
        const child = React.Children.only(this.props.children);
        return child && (child as any).props;
    }

    handleShow() {
        // clearTimeout(this.timer);
        // const {
        //     delay
        // } = this.props;

        // this.timer = setTimeout(this.show, delay);
        // 顺速让即将消失的层消失。
        waitToHide && waitToHide();
        this.show();
    }

    handleHide() {
        clearTimeout(this.timer);
        const {delay} = this.props;

        waitToHide = this.hide.bind(this);
        this.timer = setTimeout(this.hide, delay);
    }

    handleFocus(e: any) {
        const {onFocus} = this.getChildProps();
        this.handleShow();
        onFocus && onFocus(e);
    }

    handleBlur(e: any) {
        const {onBlur} = this.getChildProps();
        this.handleHide();
        onBlur && onBlur(e);
    }

    handleMouseOver(e: any) {
        this.handleMouseOverOut(this.handleShow, e, 'fromElement');
    }

    handleMouseOut(e: any) {
        this.handleMouseOverOut(this.handleHide, e, 'toElement');
    }

    handleMouseOverOut(handler: Function, e: React.MouseEvent<HTMLElement>, relatedNative: string) {
        const target = e.currentTarget;
        const related: any = e.relatedTarget || (e as any).nativeEvent[relatedNative];

        if ((!related || related !== target) && !target.contains(related)) {
            handler(e);
        }
    }

    handleClick(e: any) {
        const {onClick} = this.getChildProps();
        this.state.show ? this.hide() : this.show();
        onClick && onClick(e);
    }

    render() {
        const {tooltip, children, placement, container, trigger, rootClose} = this.props;

        const child = React.Children.only(children);

        if (!tooltip) {
            return child;
        }

        const childProps: any = {
            ref: this.targetRef,
            key: 'target'
        };

        const triggers = Array.isArray(trigger) ? trigger.concat() : [trigger];

        if (~triggers.indexOf('click')) {
            childProps.onClick = this.handleClick;
        }

        if (~triggers.indexOf('focus')) {
            childProps.onFocus = this.handleShow;
            childProps.onBlur = this.handleHide;
        }

        if (~triggers.indexOf('hover')) {
            childProps.onMouseOver = this.handleMouseOver;
            childProps.onMouseOut = this.handleMouseOut;
        }

        return [
            child ? React.cloneElement(child as any, childProps) : null,

            <Overlay
                key="overlay"
                target={this.getTarget}
                show={this.state.show}
                onHide={this.handleHide}
                rootClose={rootClose}
                placement={placement}
                container={container}
            >
                <Tooltip title={typeof tooltip !== 'string' ? tooltip.title : undefined}>
                    <Html html={typeof tooltip === 'string' ? tooltip : tooltip.content} />
                </Tooltip>
            </Overlay>
        ];
    }
}

export default themeable(
    uncontrollable(TooltipWrapper, {
        show: 'onVisibleChange'
    })
);
