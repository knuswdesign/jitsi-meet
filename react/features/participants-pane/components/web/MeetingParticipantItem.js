// @flow

import React, { useCallback, useEffect, useState } from 'react';

import { isSupported } from '../../../av-moderation/functions';
import { translate } from '../../../base/i18n';
import { JitsiTrackEvents } from '../../../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../../base/media';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined,
    getParticipantDisplayName,
    isLocalParticipantModerator,
    isParticipantModerator
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import {
    getLocalAudioTrack,
    getTrackByMediaTypeAndParticipant,
    isParticipantAudioMuted,
    isParticipantVideoMuted
} from '../../../base/tracks';
import { ACTION_TRIGGER, type MediaState, MEDIA_STATE, QUICK_ACTION_BUTTON } from '../../constants';
import {
    getParticipantAudioMediaState,
    getParticipantVideoMediaState,
    getQuickActionButtonType
} from '../../functions';
import ParticipantQuickAction from '../ParticipantQuickAction';

import ParticipantItem from './ParticipantItem';
import { ParticipantActionEllipsis } from './styled';

type Props = {

    /**
     * Media state for audio.
     */
    _audioMediaState: MediaState,

    /**
     * The audio track related to the participant.
     */
    _audioTrack: ?Object,

    /**
     * Whether or not to disable the moderator indicator.
     */
    _disableModeratorIndicator: boolean,

    /**
     * The display name of the participant.
     */
    _displayName: string,

    /**
     * Whether or not moderation is supported.
     */
    _isModerationSupported: boolean,

    /**
     * True if the participant is the local participant.
     */
    _local: Boolean,

    /**
     * Whether or not the local participant is moderator.
     */
    _localModerator: boolean,

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean,

    /**
     * The participant.
     */
    _participant: Object,

    /**
     * The participant ID.
     *
     * NOTE: This ID may be different from participantID prop in the case when we pass undefined for the local
     * participant. In this case the local participant ID will be filled trough _participantID prop.
     */
    _participantID: string,

    /**
     * The type of button to be rendered for the quick action.
     */
    _quickActionButtonType: string,

    /**
     * True if the participant have raised hand.
     */
    _raisedHand: boolean,

    /**
     * Media state for video.
     */
    _videoMediaState: MediaState,

    /**
     * The translated ask unmute text for the qiuck action buttons.
     */
    askUnmuteText: string,

    /**
     * Is this item highlighted
     */
    isHighlighted: boolean,

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * The translated text for the mute participant button.
     */
    muteParticipantButtonText: string,

    /**
     * Callback for the activation of this item's context menu
     */
    onContextMenu: Function,

    /**
     * Callback for the mouse leaving this item
     */
    onLeave: Function,

    /**
     * Callback used to open an actions drawer for a participant.
     */
    openDrawerForParticipant: Function,

    /**
     * True if an overflow drawer should be displayed.
     */
    overflowDrawer: boolean,


    /**
     * The aria-label for the ellipsis action.
     */
    participantActionEllipsisLabel: string,

    /**
     * The ID of the participant.
     */
    participantID: ?string,

    /**
     * The translate function.
     */
    t: Function,

    /**
     * The translated "you" text.
     */
    youText: string
};

/**
 * Implements the MeetingParticipantItem component.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function MeetingParticipantItem({
    _audioMediaState,
    _audioTrack,
    _disableModeratorIndicator,
    _displayName,
    _isModerationSupported,
    _local,
    _localModerator,
    _localVideoOwner,
    _participant,
    _participantID,
    _quickActionButtonType,
    _raisedHand,
    _videoMediaState,
    askUnmuteText,
    isHighlighted,
    muteAudio,
    muteParticipantButtonText,
    onContextMenu,
    onLeave,
    openDrawerForParticipant,
    overflowDrawer,
    participantActionEllipsisLabel,
    t,
    youText
}: Props) {

    const [ hasAudioLevels, setHasAudioLevel ] = useState(false);
    const [ registeredEvent, setRegisteredEvent ] = useState(false);

    const _updateAudioLevel = useCallback(level => {
        const audioLevel = typeof level === 'number' && !isNaN(level)
            ? level : 0;

        setHasAudioLevel(audioLevel > 0.009);
    }, []);

    useEffect(() => {
        if (_audioTrack && !registeredEvent) {
            const { jitsiTrack } = _audioTrack;

            if (jitsiTrack) {
                jitsiTrack.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, _updateAudioLevel);
                setRegisteredEvent(true);
            }
        }

        return () => {
            if (_audioTrack && registeredEvent) {
                const { jitsiTrack } = _audioTrack;

                jitsiTrack && jitsiTrack.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, _updateAudioLevel);
            }
        };
    }, [ _audioTrack ]);

    const audioMediaState = _audioMediaState === MEDIA_STATE.UNMUTED && hasAudioLevels
        ? MEDIA_STATE.DOMINANT_SPEAKER : _audioMediaState;

    let askToUnmuteText = askUnmuteText;

    if (_audioMediaState !== MEDIA_STATE.FORCE_MUTED && _videoMediaState === MEDIA_STATE.FORCE_MUTED) {
        askToUnmuteText = t('participantsPane.actions.allowVideo');
    }

    const buttonType = _isModerationSupported
        ? _localModerator ? QUICK_ACTION_BUTTON.ASK_TO_UNMUTE : _quickActionButtonType
        : '';

    return (
        <ParticipantItem
            actionsTrigger = { ACTION_TRIGGER.HOVER }
            audioMediaState = { audioMediaState }
            disableModeratorIndicator = { _disableModeratorIndicator }
            displayName = { _displayName }
            isHighlighted = { isHighlighted }
            isModerator = { isParticipantModerator(_participant) }
            local = { _local }
            onLeave = { onLeave }
            openDrawerForParticipant = { openDrawerForParticipant }
            overflowDrawer = { overflowDrawer }
            participantID = { _participantID }
            raisedHand = { _raisedHand }
            videoMediaState = { _videoMediaState }
            youText = { youText }>

            {!overflowDrawer && !_participant?.isFakeParticipant
                && <>
                    <ParticipantQuickAction
                        askUnmuteText = { askToUnmuteText }
                        buttonType = { buttonType }
                        muteAudio = { muteAudio }
                        muteParticipantButtonText = { muteParticipantButtonText }
                        participantID = { _participantID } />
                    <ParticipantActionEllipsis
                        aria-label = { participantActionEllipsisLabel }
                        onClick = { onContextMenu } />
                </>
            }

            {!overflowDrawer && _localVideoOwner && _participant?.isFakeParticipant && (
                <ParticipantActionEllipsis
                    aria-label = { participantActionEllipsisLabel }
                    onClick = { onContextMenu } />
            )}
        </ParticipantItem>
    );
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { participantID } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state).id;

    const participant = getParticipantByIdOrUndefined(state, participantID);

    const _isAudioMuted = isParticipantAudioMuted(participant, state);
    const _isVideoMuted = isParticipantVideoMuted(participant, state);
    const _audioMediaState = getParticipantAudioMediaState(participant, _isAudioMuted, state);
    const _videoMediaState = getParticipantVideoMediaState(participant, _isVideoMuted, state);
    const _quickActionButtonType = getQuickActionButtonType(participant, _isAudioMuted, state);

    const tracks = state['features/base/tracks'];
    const _audioTrack = participantID === localParticipantId
        ? getLocalAudioTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, participantID);

    const { disableModeratorIndicator } = state['features/base/config'];

    const _localModerator = isLocalParticipantModerator(state);

    return {
        _audioMediaState,
        _audioTrack,
        _disableModeratorIndicator: disableModeratorIndicator,
        _displayName: getParticipantDisplayName(state, participant?.id),
        _isModerationSupported: isSupported()(state),
        _local: Boolean(participant?.local),
        _localModerator,
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _participant: participant,
        _participantID: participant?.id,
        _quickActionButtonType,
        _raisedHand: Boolean(participant?.raisedHand),
        _videoMediaState
    };
}

export default translate(connect(_mapStateToProps)(MeetingParticipantItem));
