import './RobotHero.css';

function RobotHero() {
  return (
    <div className="robot-hero">
      <video
        src="/videos/robot-saludo.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="robot-hero-video"
      />
    </div>
  );
}

export default RobotHero;