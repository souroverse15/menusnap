import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const CountdownTimer = ({
  estimatedReadyTime,
  status,
  onComplete = null,
  className = "",
}) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!estimatedReadyTime || !["ACCEPTED", "IN_PROGRESS"].includes(status)) {
      setTimeLeft(null);
      setIsExpired(false);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const readyTime = new Date(estimatedReadyTime).getTime();
      const difference = readyTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        if (onComplete) onComplete();
        return;
      }

      const minutes = Math.floor(difference / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ minutes, seconds });
      setIsExpired(false);
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [estimatedReadyTime, status, onComplete]);

  if (!timeLeft && !isExpired) {
    return null;
  }

  const formatTime = (time) => {
    if (time === null) return "00:00";
    return `${time.minutes.toString().padStart(2, "0")}:${time.seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getStatusColor = () => {
    if (isExpired) return "text-red-600 bg-red-100";
    if (timeLeft && timeLeft.minutes < 5)
      return "text-orange-600 bg-orange-100";
    return "text-blue-600 bg-blue-100";
  };

  const getStatusText = () => {
    if (isExpired) return "Ready for pickup!";
    if (status === "ACCEPTED") return "Preparing in:";
    if (status === "IN_PROGRESS") return "Ready in:";
    return "Estimated time:";
  };

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()} ${className}`}
    >
      <Clock className="h-4 w-4" />
      <span>{getStatusText()}</span>
      <span className="font-mono font-bold">
        {isExpired ? "00:00" : formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default CountdownTimer;
