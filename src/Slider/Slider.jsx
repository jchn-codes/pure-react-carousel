import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '../';
import { CarouselPropTypes, cn, pct } from '../helpers';
import s from './slider.css';

const Slider = class Slider extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    currentSlide: PropTypes.number.isRequired,
    hasMasterSpinner: PropTypes.bool.isRequired,
    masterSpinnerErrorCount: PropTypes.number.isRequired,
    masterSpinnerSuccessCount: PropTypes.number.isRequired,
    masterSpinnerSubscriptionCount: PropTypes.number.isRequired,
    naturalSlideHeight: PropTypes.number.isRequired,
    naturalSlideWidth: PropTypes.number.isRequired,
    onMasterSpinner: PropTypes.func,
    orientation: CarouselPropTypes.orientation.isRequired,
    slideTraySize: PropTypes.number.isRequired,
    slideSize: PropTypes.number.isRequired,
    store: PropTypes.object.isRequired,
    style: PropTypes.object,
    tabIndex: PropTypes.number,
    totalSlides: PropTypes.number.isRequired,
    touchEnabled: PropTypes.bool.isRequired,
    trayTag: PropTypes.string,
    visibleSlides: PropTypes.number,
  }

  static defaultProps = {
    className: '',
    height: null,
    onMasterSpinner: null,
    style: {},
    tabIndex: null,
    trayTag: 'ul',
    visibleSlides: 1,
  }


  constructor() {
    super();
    this.handleOnTouchStart = this.handleOnTouchStart.bind(this);
    this.handleOnTouchMove = this.handleOnTouchMove.bind(this);
    this.handleOnTouchEnd = this.handleOnTouchEnd.bind(this);
    this.handleOnKeyDown = this.handleOnKeyDown.bind(this);

    this.state = {
      deltaX: 0,
      deltaY: 0,
      startX: 0,
      startY: 0,
      isBeingTouchDragged: false,
    };

    this.originalOverflow = null;
  }

  handleOnTouchStart(ev) {
    if (!this.props.touchEnabled) return;

    const touch = ev.targetTouches[0];
    this.originalOverflow = this.originalOverflow || document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    this.setState({
      isBeingTouchDragged: true,
      startX: touch.screenX,
      startY: touch.screenY,
    });
  }

  handleOnTouchMove(ev) {
    if (!this.props.touchEnabled) return;

    const touch = ev.targetTouches[0];
    this.setState({
      deltaX: touch.screenX - this.state.startX,
      deltaY: touch.screenY - this.state.startY,
    });
  }

  handleOnKeyDown(ev) {
    const { keyCode } = ev;
    const { currentSlide, store, totalSlides, visibleSlides } = this.props;
    const newStoreState = {};
    let isUpdated = false;

    if (totalSlides <= visibleSlides) return;

    // left arrow
    if (keyCode === 37) {
      ev.preventDefault();
      ev.stopPropagation();
      this.focus();
      if (currentSlide > 0) {
        newStoreState.currentSlide = currentSlide - 1;
        isUpdated = true;
      }
    }

    // right arrow
    if (keyCode === 39) {
      ev.preventDefault();
      ev.stopPropagation();
      this.focus();
      if (currentSlide < (totalSlides - visibleSlides)) {
        newStoreState.currentSlide = currentSlide + 1;
        isUpdated = true;
      }
    }

    if (isUpdated && typeof newStoreState.currentSlide === 'number') {
      store.setStoreState(newStoreState);
    }
  }

  static slideSizeInPx(orientation, sliderTrayWidth, sliderTrayHeight, totalSlides) {
    return (orientation === 'horizontal' ? sliderTrayWidth : sliderTrayHeight) / totalSlides;
  }

  static slidesMoved(orientation, deltaX, deltaY, slideSizeInPx) {
    return -Math.round((orientation === 'horizontal' ? deltaX : deltaY) / slideSizeInPx);
  }

  computeCurrentSlide() {
    const slideSizeInPx = Slider.slideSizeInPx(
      this.props.orientation,
      this.sliderTrayElement.clientWidth,
      this.sliderTrayElement.clientHeight,
      this.props.totalSlides,
    );

    const slidesMoved = Slider.slidesMoved(
      this.props.orientation,
      this.state.deltaX,
      this.state.deltaY,
      slideSizeInPx,
    );

    const maxSlide = this.props.totalSlides - Math.min(
      this.props.totalSlides, this.props.visibleSlides,
    );

    let newCurrentSlide = this.props.currentSlide + slidesMoved;
    newCurrentSlide = Math.max(0, newCurrentSlide);
    newCurrentSlide = Math.min(maxSlide, newCurrentSlide);

    this.props.store.setStoreState({
      currentSlide: newCurrentSlide,
    });
  }

  focus() {
    this.sliderElement.focus();
  }

  handleOnTouchEnd(ev) {
    if (!this.props.touchEnabled) return;

    if (ev.targetTouches.length === 0) {
      this.computeCurrentSlide();
      document.documentElement.style.overflow = this.originalOverflow;
      this.originalOverflow = null;
      this.setState({
        deltaX: 0,
        deltaY: 0,
        isBeingTouchDragged: false,
      });
    }
  }

  renderMasterSpinner() {
    const {
      hasMasterSpinner, masterSpinnerErrorCount,
      masterSpinnerSuccessCount, masterSpinnerSubscriptionCount,
    } = this.props;

    const testImageCountReached = (
      masterSpinnerErrorCount + masterSpinnerSuccessCount
    ) === masterSpinnerSubscriptionCount;

    const testInitialLoad = masterSpinnerSubscriptionCount === 0;

    if (hasMasterSpinner && (!testImageCountReached || testInitialLoad)) {
      if (typeof this.props.onMasterSpinner === 'function') this.props.onMasterSpinner();

      return (
        <div
          className={cn([
            s.masterSpinnerContainer,
            'carousel__master-spinner-container',
          ])}
        >
          <Spinner />
        </div>
      );
    }

    return null;
  }

  render() {
    const {
      children, className, currentSlide, hasMasterSpinner, masterSpinnerErrorCount,
      masterSpinnerSubscriptionCount, masterSpinnerSuccessCount, naturalSlideHeight,
      naturalSlideWidth, onMasterSpinner, orientation, slideTraySize, slideSize, store, style,
      tabIndex, totalSlides, touchEnabled, trayTag: TrayTag, visibleSlides,
      ...props
    } = this.props;

    const sliderStyle = Object.assign({}, style);

    // slider tray wrap
    const trayWrapStyle = {};

    if (orientation === 'vertical') {
      trayWrapStyle.height = 0;
      trayWrapStyle.paddingBottom = pct(
        (naturalSlideHeight * 100 * visibleSlides) / naturalSlideWidth,
      );
      trayWrapStyle.width = pct(100);
    }


    // slider tray
    const trayStyle = {};
    const trans = pct(slideSize * currentSlide * -1);

    if (this.state.isBeingTouchDragged) {
      trayStyle.transition = 'none';
    }

    if (orientation === 'vertical') {
      trayStyle.top = `translateY(${trans}) translateY(${this.state.deltaY}px)`;
      trayStyle.width = pct(100);
    } else {
      trayStyle.width = pct(slideTraySize);
      trayStyle.transform = `translateX(${trans}) translateX(${this.state.deltaX}px)`;
    }

    // console.log(Object.assign({}, trayStyle), new Date());


    const sliderClasses = cn([
      orientation === 'vertical' ? s.verticalSlider : s.horizontalSlider,
      'carousel__slider',
      orientation === 'vertical' ? 'carousel__slider--vertical' : 'carousel__slider--horizontal',
      className,
    ]);

    const trayClasses = cn([
      s.sliderTray,
      'carousel__slider-tray',
      orientation === 'vertical' ? s.verticalTray : s.horizontalTray,
      orientation === 'vertical' ? 'carousel__slider-tray--vertical' : 'carousel__slider-tray--horizontal',
    ]);

    const trayWrapClasses = cn([
      s.sliderTrayWrap,
      'carousel__slider-tray-wrapper',
      orientation === 'vertical' ? s.verticalSlideTrayWrap : s.horizontalTrayWrap,
      orientation === 'vertical' ? 'carousel__slider-tray-wrap--vertical' : 'carousel__slider-tray-wrap--horizontal',
    ]);

    const newTabIndex = tabIndex !== null ? tabIndex : 0;

    return (
      <div
        ref={(el) => { this.sliderElement = el; }}
        className={sliderClasses}
        aria-live="polite"
        style={sliderStyle}
        tabIndex={newTabIndex}
        onKeyDown={this.handleOnKeyDown}
        role="listbox"
        {...props}
      >
        <div className={trayWrapClasses} style={trayWrapStyle}>
          <TrayTag
            ref={(el) => { this.sliderTrayElement = el; }}
            className={trayClasses}
            style={trayStyle}
            onTouchStart={this.handleOnTouchStart}
            onTouchMove={this.handleOnTouchMove}
            onTouchEnd={this.handleOnTouchEnd}
          >
            {children}
          </TrayTag>
          {this.renderMasterSpinner()}
        </div>
      </div>
    );
  }
};

export default Slider;
