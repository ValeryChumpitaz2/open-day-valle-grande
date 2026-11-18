
import { useEffect, useState } from 'react';
import './Countdown.css';

function calculateTime(eventDate) {
  if (!eventDate) return null;

  const targetDate = new Date(eventDate).getTime();

  if (Number.isNaN(targetDate)) return null;

  const difference = targetDate - Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference / 3600000) % 24),
    minutes: Math.floor((difference / 60000) % 60),
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

  if (!timeLeft) return null;

  const counters = [
    { label: 'DÍAS', value: timeLeft.days },
    { label: 'HORAS', value: timeLeft.hours },
    { label: 'MIN', value: timeLeft.minutes },
    { label: 'SEG', value: timeLeft.seconds }
  ];

  return (
    <section className="countdown-section">
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
    </section>
  );
}

export default Countdown;
