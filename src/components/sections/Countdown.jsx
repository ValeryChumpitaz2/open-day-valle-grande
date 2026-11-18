
import { useEffect, useState } from 'react';
import './Countdown.css';

function calculateTime(eventDate) {
  const difference = new Date(eventDate).getTime() - Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
}

function Countdown({ eventDate }) {
  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTime(eventDate)
  );

  useEffect(() => {
    const updateCountdown = () => {
      setTimeLeft(calculateTime(eventDate));
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [eventDate]);

  const counters = [
    { label: 'DÍAS', value: timeLeft.days },
    { label: 'HORAS', value: timeLeft.hours },
    { label: 'MIN', value: timeLeft.minutes },
    { label: 'SEG', value: timeLeft.seconds }
  ];

  return (
    <div className="countdown-section">
      <div className="countdown-heading">
        <span className="countdown-indicator"></span>
        <h2>¡Cuenta regresiva para nuestro Open Day!</h2>
      </div>

      <div className="countdown-timer">
        {counters.map((item) => (
          <div className="countdown-item" key={item.label}>
            <strong className="countdown-number">
              {String(item.value).padStart(2, '0')}
            </strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Countdown;
