import React, { useEffect, useRef } from 'react';
import useCollection from './useCollection';
import { useParams } from 'react-router-dom';
import useDocWithCache from './useDocWithCache';
import formatDate from 'date-fns/format';
import isSameDay from 'date-fns/isSameDay';

function ChatScroller(props) {
  const ref = useRef();
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    if (shouldScrollRef.current) {
      const node = ref.current;
      node.scrollTop = node.scrollHeight;
    }
  });

  const handleScroll = () => {
    const node = ref.current;
    const { scrollTop, clientHeight, scrollHeight } = node;
    const atBottom = scrollHeight === clientHeight + scrollTop;
    shouldScrollRef.current = atBottom;
  };

  return <div onScroll={handleScroll} ref={ref} {...props} />;
}

function Messages() {
  const { channelId } = useParams();
  const messages = useCollection(`channels/${channelId}/messages`, 'createdAt');

  return (
    <ChatScroller className="Messages">
      <div className="EndOfMessages">That's every message!</div>

      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const showDay = shouldShowDay(previous, message);
        const showAvatar = shouldShowAvatar(previous, message);
        return showAvatar ? (
          <FirstMessageFromUser
            key={message.id}
            message={message}
            showDay={showDay}
          />
        ) : (
          <div key={message.id}>
            <div className="Message no-avatar">
              <div className="MessageContent">{message.text}</div>
            </div>
          </div>
        );
      })}
    </ChatScroller>
  );
}

function FirstMessageFromUser({ message, showDay }) {
  const author = useDocWithCache(message.user.path);

  return (
    <div>
      {showDay && (
        <div className="Day">
          <div className="DayLine" />
          <div className="DayText">
            {new Date(message.createdAt.seconds * 1000).toLocaleDateString()}
          </div>
          <div className="DayLine" />
        </div>
      )}
      <div className="Message with-avatar">
        <div
          className="Avatar"
          style={{ backgroundImage: author ? `url("${author.photoUrl}")` : '' }}
        />
        <div className="Author">
          <div>
            <span className="UserName">{author?.displayName}</span>{' '}
            <span className="TimeStamp">
              {formatDate(message.createdAt.seconds * 1000, 'h:mm a')}
            </span>
          </div>
          <div className="MessageContent">{message.text}</div>
        </div>
      </div>
    </div>
  );
}

function shouldShowDay(previous, message) {
  const isFirst = !previous;
  if (isFirst) {
    return true;
  }

  const isOtherDay = !isSameDay(
    previous.createdAt.seconds * 1000,
    message.createdAt.seconds * 1000
  );
  return isOtherDay;
}

function shouldShowAvatar(previous, message) {
  const isFirst = !previous;
  if (isFirst) {
    return true;
  }

  const isDifferentUser = message.user.id !== previous.user.id;
  if (isDifferentUser) {
    return true;
  }

  const hasBeenAWhile =
    message.createdAt.seconds - previous.createdAt.seconds > 180;
  return hasBeenAWhile;
}

export default Messages;
