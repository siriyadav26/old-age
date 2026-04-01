import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  ShieldCheck,
  HeartPulse,
  ClipboardList,
  CheckCircle,
} from "lucide-react";

// Health assessment questions (unchanged)
const healthQuestions = [
  {
    id: "sleep",
    label: "How many hours did you sleep last night?",
    type: "range",
    min: 0,
    max: 12,
    step: 0.5,
    default: 7,
    icon: "🌙",
    category: "basic",
    weight: 0.12,
  },
  {
    id: "sleepQuality",
    label: "How would you rate your sleep quality?",
    type: "select",
    options: ["Very poor", "Poor", "Fair", "Good", "Excellent"],
    default: "Good",
    icon: "💤",
    category: "basic",
    weight: 0.08,
  },
  {
    id: "pain",
    label: "Are you experiencing any pain today?",
    type: "select",
    options: ["None", "Mild", "Moderate", "Severe"],
    default: "None",
    icon: "🤕",
    category: "physical",
    weight: 0.1,
  },
  {
    id: "painLocation",
    label: "If you have pain, where is it located?",
    type: "multiselect",
    options: [
      "Head",
      "Neck",
      "Shoulders",
      "Back",
      "Joints",
      "Chest",
      "Stomach",
      "Other",
    ],
    default: [],
    icon: "📍",
    category: "physical",
    condition: (answers) => answers.pain !== "None",
    weight: 0.05,
  },
  {
    id: "medication",
    label: "Did you take all your medications today?",
    type: "boolean",
    default: true,
    icon: "💊",
    category: "medication",
    weight: 0.15,
  },
  {
    id: "medicationSideEffects",
    label: "Are you experiencing any medication side effects?",
    type: "select",
    options: ["None", "Mild", "Moderate", "Severe"],
    default: "None",
    icon: "⚠️",
    category: "medication",
    weight: 0.08,
  },
  {
    id: "activity",
    label: "Physical activity level today?",
    type: "select",
    options: ["Very low", "Low", "Moderate", "High"],
    default: "Moderate",
    icon: "🏃",
    category: "physical",
    weight: 0.08,
  },
  {
    id: "exercise",
    label: "What type of physical activity did you do?",
    type: "multiselect",
    options: [
      "Walking",
      "Stretching",
      "Light exercises",
      "Yoga",
      "Gardening",
      "None",
    ],
    default: [],
    icon: "🚶",
    category: "physical",
    condition: (answers) => answers.activity !== "Very low",
    weight: 0.05,
  },
  {
    id: "mood",
    label: "How would you rate your mood?",
    type: "select",
    options: ["Very unhappy", "Unhappy", "Neutral", "Happy", "Very happy"],
    default: "Neutral",
    icon: "😊",
    category: "mental",
    weight: 0.12,
  },
  {
    id: "anxiety",
    label: "Are you feeling anxious or worried today?",
    type: "select",
    options: ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"],
    default: "Not at all",
    icon: "😰",
    category: "mental",
    weight: 0.08,
  },
  {
    id: "socialInteraction",
    label: "Have you interacted with anyone today?",
    type: "select",
    options: [
      "No one",
      "Family/phone call",
      "Family/visited",
      "Friends",
      "Caregiver",
      "Group activity",
    ],
    default: "No one",
    icon: "👥",
    category: "social",
    weight: 0.07,
  },
  {
    id: "appetite",
    label: "How is your appetite today?",
    type: "select",
    options: ["Very poor", "Poor", "Normal", "Good", "Very good"],
    default: "Normal",
    icon: "🍽️",
    category: "nutrition",
    weight: 0.06,
  },
  {
    id: "water",
    label: "How many glasses of water did you drink today?",
    type: "range",
    min: 0,
    max: 12,
    step: 1,
    default: 6,
    icon: "💧",
    category: "nutrition",
    weight: 0.06,
  },
  {
    id: "bathroom",
    label: "Any issues with using the bathroom today?",
    type: "select",
    options: [
      "No issues",
      "Difficulty walking",
      "Need assistance",
      "Accidents",
      "Other",
    ],
    default: "No issues",
    icon: "🚽",
    category: "physical",
    weight: 0.05,
  },
  {
    id: "dizziness",
    label: "Have you felt dizzy or unsteady today?",
    type: "boolean",
    default: false,
    icon: "😵",
    category: "physical",
    weight: 0.06,
  },
  {
    id: "fall",
    label: "Have you had any falls or near-falls today?",
    type: "boolean",
    default: false,
    icon: "⚠️",
    category: "safety",
    weight: 0.08,
  },
  {
    id: "breathing",
    label: "Any breathing difficulties today?",
    type: "select",
    options: ["None", "Mild", "Moderate", "Severe"],
    default: "None",
    icon: "🌬️",
    category: "physical",
    weight: 0.07,
  },
  {
    id: "memory",
    label: "How has your memory been today?",
    type: "select",
    options: [
      "Better than usual",
      "Normal",
      "Slightly forgetful",
      "Very forgetful",
    ],
    default: "Normal",
    icon: "🧠",
    category: "cognitive",
    weight: 0.07,
  },
  {
    id: "confusion",
    label: "Have you felt confused or disoriented today?",
    type: "boolean",
    default: false,
    icon: "🤔",
    category: "cognitive",
    weight: 0.06,
  },
  {
    id: "loneliness",
    label: "Have you felt lonely today?",
    type: "select",
    options: ["Not at all", "A little", "Moderately", "Very much", "Extremely"],
    default: "Not at all",
    icon: "💔",
    category: "mental",
    weight: 0.06,
  },
  {
    id: "interest",
    label: "Have you enjoyed your usual activities/hobbies today?",
    type: "select",
    options: ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"],
    default: "Moderately",
    icon: "🎨",
    category: "mental",
    weight: 0.06,
  },
  {
    id: "energy",
    label: "How is your energy level today?",
    type: "select",
    options: ["Very low", "Low", "Moderate", "High", "Very high"],
    default: "Moderate",
    icon: "⚡",
    category: "physical",
    weight: 0.07,
  },
  {
    id: "vision",
    label: "Any changes in your vision today?",
    type: "boolean",
    default: false,
    icon: "👁️",
    category: "physical",
    weight: 0.04,
  },
  {
    id: "hearing",
    label: "Any changes in your hearing today?",
    type: "boolean",
    default: false,
    icon: "👂",
    category: "physical",
    weight: 0.04,
  },
  {
    id: "medicationReminder",
    label: "Did you need help remembering to take medications?",
    type: "boolean",
    default: false,
    icon: "🔔",
    category: "medication",
    weight: 0.05,
  },
];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [assessmentCompletedToday, setAssessmentCompletedToday] =
    useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setStats(data);
      const today = new Date().toISOString().split("T")[0];
      const todayAssessment = data.assessments?.find((a) => a.date === today);
      if (todayAssessment) {
        setAssessmentCompletedToday(true);
        setAssessmentAnswers(todayAssessment.answers);
      } else {
        const defaults = {};
        healthQuestions.forEach((q) => {
          defaults[q.id] = q.default;
        });
        setAssessmentAnswers(defaults);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complex calculation for Daily Health Score (0-100)
  const calculateDailyHealthScore = (answers) => {
    let totalScore = 0;
    let totalWeight = 0;

    for (const question of healthQuestions) {
      if (question.condition && !question.condition(answers)) continue;

      let score = 0;
      const value = answers[question.id];

      switch (question.id) {
        case "sleep":
          // Optimal sleep is 7-8 hours, penalize less or more
          if (value >= 7 && value <= 8) score = 100;
          else if (value >= 6 && value <= 9) score = 80;
          else if (value >= 5 && value <= 10) score = 60;
          else if (value >= 4 && value <= 11) score = 40;
          else score = 20;
          break;

        case "sleepQuality":
          const qualityMap = {
            "Very poor": 20,
            Poor: 40,
            Fair: 60,
            Good: 80,
            Excellent: 100,
          };
          score = qualityMap[value] || 60;
          break;

        case "pain":
          const painMap = { None: 100, Mild: 70, Moderate: 40, Severe: 10 };
          score = painMap[value] || 50;
          break;

        case "medication":
          score = value ? 100 : 0;
          break;

        case "medicationSideEffects":
          const sideEffectMap = {
            None: 100,
            Mild: 75,
            Moderate: 40,
            Severe: 10,
          };
          score = sideEffectMap[value] || 50;
          break;

        case "activity":
          const activityMap = {
            "Very low": 25,
            Low: 50,
            Moderate: 75,
            High: 100,
          };
          score = activityMap[value] || 50;
          break;

        case "mood":
          const moodMap = {
            "Very unhappy": 20,
            Unhappy: 40,
            Neutral: 60,
            Happy: 80,
            "Very happy": 100,
          };
          score = moodMap[value] || 60;
          break;

        case "anxiety":
          const anxietyMap = {
            "Not at all": 100,
            Slightly: 75,
            Moderately: 50,
            "Very much": 25,
            Extremely: 0,
          };
          score = anxietyMap[value] || 50;
          break;

        case "socialInteraction":
          const socialMap = {
            "No one": 20,
            "Family/phone call": 60,
            "Family/visited": 80,
            Friends: 85,
            Caregiver: 75,
            "Group activity": 100,
          };
          score = socialMap[value] || 50;
          break;

        case "appetite":
          const appetiteMap = {
            "Very poor": 20,
            Poor: 40,
            Normal: 70,
            Good: 85,
            "Very good": 100,
          };
          score = appetiteMap[value] || 60;
          break;

        case "water":
          // Optimal water intake is 6-8 glasses
          if (value >= 6 && value <= 8) score = 100;
          else if (value >= 4 && value <= 10) score = 70;
          else if (value >= 2 && value <= 12) score = 40;
          else score = 20;
          break;

        case "bathroom":
          const bathroomMap = {
            "No issues": 100,
            "Difficulty walking": 60,
            "Need assistance": 40,
            Accidents: 10,
            Other: 50,
          };
          score = bathroomMap[value] || 70;
          break;

        case "dizziness":
          score = value ? 30 : 100;
          break;

        case "fall":
          score = value ? 0 : 100;
          break;

        case "breathing":
          const breathingMap = {
            None: 100,
            Mild: 70,
            Moderate: 40,
            Severe: 10,
          };
          score = breathingMap[value] || 70;
          break;

        case "memory":
          const memoryMap = {
            "Better than usual": 100,
            Normal: 80,
            "Slightly forgetful": 50,
            "Very forgetful": 20,
          };
          score = memoryMap[value] || 70;
          break;

        case "confusion":
          score = value ? 20 : 100;
          break;

        case "loneliness":
          const lonelinessMap = {
            "Not at all": 100,
            "A little": 75,
            Moderately: 50,
            "Very much": 25,
            Extremely: 0,
          };
          score = lonelinessMap[value] || 60;
          break;

        case "interest":
          const interestMap = {
            "Not at all": 20,
            Slightly: 40,
            Moderately: 60,
            "Very much": 80,
            Extremely: 100,
          };
          score = interestMap[value] || 60;
          break;

        case "energy":
          const energyMap = {
            "Very low": 20,
            Low: 40,
            Moderate: 60,
            High: 80,
            "Very high": 100,
          };
          score = energyMap[value] || 60;
          break;

        case "vision":
          score = value ? 50 : 100;
          break;

        case "hearing":
          score = value ? 50 : 100;
          break;

        case "medicationReminder":
          score = value ? 60 : 100;
          break;

        case "painLocation":
          // More pain locations = lower score
          const locationCount = value?.length || 0;
          score = Math.max(0, 100 - locationCount * 15);
          break;

        case "exercise":
          const exerciseBonus = value?.length || 0;
          score = Math.min(100, 50 + exerciseBonus * 10);
          break;

        default:
          score = 70;
      }

      totalScore += score * (question.weight || 0.05);
      totalWeight += question.weight || 0.05;
    }

    // Normalize to 0-100
    return Math.round(totalScore / totalWeight);
  };

  // Calculate Med Compliance specifically
  const calculateMedCompliance = (answers) => {
    let medScore = 0;
    let medCount = 0;

    // Check medication adherence
    if (answers.medication !== undefined) {
      medScore += answers.medication ? 100 : 0;
      medCount++;
    }

    // Check side effects
    if (answers.medicationSideEffects) {
      const sideEffectMap = { None: 100, Mild: 75, Moderate: 40, Severe: 10 };
      medScore += sideEffectMap[answers.medicationSideEffects] || 50;
      medCount++;
    }

    // Check if needed help with reminders
    if (answers.medicationReminder !== undefined) {
      medScore += answers.medicationReminder ? 60 : 100;
      medCount++;
    }

    return medCount > 0 ? Math.round(medScore / medCount) : 100;
  };

  // Determine if day is safe based on critical factors
  const isDaySafe = (answers) => {
    // Critical factors that make a day unsafe
    if (answers.fall === true) return false;
    if (answers.pain === "Severe") return false;
    if (answers.breathing === "Severe") return false;
    if (answers.confusion === true) return false;
    if (answers.medication === false) return false;
    if (answers.dizziness === true && answers.fall === true) return false;

    // Multiple moderate issues can also indicate unsafe
    let riskScore = 0;
    if (answers.pain === "Moderate") riskScore += 2;
    if (answers.breathing === "Moderate") riskScore += 2;
    if (answers.anxiety === "Very much") riskScore += 1;
    if (answers.anxiety === "Extremely") riskScore += 2;
    if (answers.dizziness === true) riskScore += 2;
    if (answers.memory === "Very forgetful") riskScore += 1;

    return riskScore < 3;
  };

  // Calculate streak of safe days
  const calculateStreak = (assessments) => {
    if (!assessments || assessments.length === 0) return 0;

    // Sort by date descending
    const sorted = [...assessments].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    let streak = 0;

    for (const assessment of sorted) {
      if (isDaySafe(assessment.answers)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Calculate average health score over last N days
  const calculateAverageHealthScore = (assessments, days = 7) => {
    if (!assessments || assessments.length === 0) return 0;

    const sorted = [...assessments].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    const recent = sorted.slice(0, days);

    if (recent.length === 0) return 0;

    const total = recent.reduce((sum, assessment) => {
      return sum + calculateDailyHealthScore(assessment.answers);
    }, 0);

    return Math.round(total / recent.length);
  };

  // Calculate average med compliance over last N days
  const calculateAverageMedCompliance = (assessments, days = 7) => {
    if (!assessments || assessments.length === 0) return 0;

    const sorted = [...assessments].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    const recent = sorted.slice(0, days);

    if (recent.length === 0) return 0;

    const total = recent.reduce((sum, assessment) => {
      return sum + calculateMedCompliance(assessment.answers);
    }, 0);

    return Math.round(total / recent.length);
  };

  const handleAnswerChange = (id, value) => {
    setAssessmentAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmitAssessment = async () => {
    setSubmitting(true);
    try {
      // Calculate metrics for this assessment
      const healthScore = calculateDailyHealthScore(assessmentAnswers);
      const medCompliance = calculateMedCompliance(assessmentAnswers);
      const safe = isDaySafe(assessmentAnswers);

      await fetch("/api/health-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          answers: assessmentAnswers,
          metrics: {
            healthScore,
            medCompliance,
            safe,
          },
        }),
      });

      await fetchDashboardData();
      setShowAssessment(false);

      const today = new Date().toISOString().split("T")[0];
      if (selectedDate === today) {
        setAssessmentCompletedToday(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!stats)
    return (
      <p style={{ fontSize: "1.2rem", textAlign: "center", padding: "40px" }}>
        Loading health data...
      </p>
    );

  const moodValueMap = {
    "Very unhappy": 20,
    Unhappy: 40,
    Neutral: 60,
    Happy: 80,
    "Very happy": 100,
  };

  const chartData = stats.moodLogs.map((log) => ({
    name: new Date(log.date).toLocaleDateString("en-US", { weekday: "short" }),
    moodValue: moodValueMap[log.mood] || 60,
    mood: log.mood,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2 className="card-title" style={{ paddingLeft: "8px", margin: 0 }}>
          Today's Status
        </h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-secondary"
          onClick={() => setShowAssessment(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
          }}
        >
          <ClipboardList size={18} />
          {assessmentCompletedToday
            ? "Update Assessment"
            : "Daily Health Check"}
        </motion.button>
      </div>

      <div className="dashboard-grid">
        <motion.div
          className="stat-card"
          variants={cardVariants}
          style={{ background: "var(--accent)" }}
        >
          <Flame size={48} color="#FF9500" />
          <p className="stat-val" style={{ color: "var(--primary)" }}>
            {stats.streak}
          </p>
          <p style={{ color: "var(--secondary)", fontWeight: 600 }}>
            Days Safe
          </p>
        </motion.div>

        <motion.div
          className="stat-card"
          variants={cardVariants}
          style={{
            background:
              stats.medicationAdherence < 100
                ? "var(--warning-bg)"
                : "var(--success-bg)",
          }}
        >
          <ShieldCheck
            size={48}
            color={
              stats.medicationAdherence < 100
                ? "var(--warning)"
                : "var(--success)"
            }
          />
          <p
            className="stat-val"
            style={{
              color:
                stats.medicationAdherence < 100
                  ? "var(--warning)"
                  : "var(--success)",
            }}
          >
            {stats.medicationAdherence}%
          </p>
          <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>
            Med Compliance
          </p>
        </motion.div>

        <motion.div
          className="stat-card"
          variants={cardVariants}
          style={{ gridColumn: "1 / -1", background: "var(--surface)" }}
        >
          <HeartPulse
            size={56}
            color="#FF2D55"
            style={{ marginBottom: "16px" }}
          />
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.2rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Overall Health Score
          </p>
          <p
            className="stat-val"
            style={{ fontSize: "4.5rem", color: "var(--primary)", margin: 0 }}
          >
            {stats.healthScore}
          </p>
          <div
            style={{
              width: "100%",
              maxWidth: "300px",
              height: "12px",
              background: "#E5E5EA",
              borderRadius: "6px",
              overflow: "hidden",
              marginTop: "24px",
            }}
          >
            <div
              style={{
                width: `${stats.healthScore}%`,
                height: "100%",
                background: "linear-gradient(90deg, #FF9500, #34C759)",
                borderRadius: "6px",
              }}
            />
          </div>
        </motion.div>
      </div>

      <motion.div className="card" variants={cardVariants}>
        <h3
          style={{
            marginBottom: "24px",
            fontSize: "1.4rem",
            color: "var(--text-main)",
          }}
        >
          Mood Trend
        </h3>
        <div style={{ height: "250px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E5EA"
              />
              <XAxis
                dataKey="name"
                fontSize={14}
                tick={{ fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                cursor={{ stroke: "rgba(0,0,0,0.05)", strokeWidth: 30 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        style={{
                          background: "var(--primary)",
                          color: "white",
                          padding: "16px",
                          borderRadius: "12px",
                          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 800,
                            fontSize: "1.2rem",
                            marginBottom: "4px",
                          }}
                        >
                          {payload[0].payload.name}
                        </p>
                        <p style={{ fontSize: "1.1rem" }}>
                          Mood: {payload[0].payload.mood}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="basis"
                dataKey="moodValue"
                stroke="var(--primary)"
                strokeWidth={5}
                dot={{
                  r: 6,
                  fill: "var(--primary)",
                  stroke: "white",
                  strokeWidth: 3,
                }}
                activeDot={{ r: 10 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Assessment Modal with date picker */}
      <AnimatePresence>
        {showAssessment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowAssessment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2 style={{ color: "var(--primary)" }}>Daily Health Check</h2>
                <button
                  onClick={() => setShowAssessment(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 500,
                  }}
                >
                  📅 Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="form-control"
                  style={{ background: "white", cursor: "pointer" }}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div
                style={{
                  maxHeight: "60vh",
                  overflowY: "auto",
                  paddingRight: "8px",
                }}
              >
                {[
                  "basic",
                  "physical",
                  "medication",
                  "mental",
                  "social",
                  "nutrition",
                  "cognitive",
                  "safety",
                ].map((category) => {
                  const categoryQuestions = healthQuestions.filter(
                    (q) => q.category === category,
                  );
                  if (categoryQuestions.length === 0) return null;

                  return (
                    <div key={category} style={{ marginBottom: "2rem" }}>
                      <h3
                        style={{
                          fontSize: "1.1rem",
                          color: "var(--primary)",
                          marginBottom: "1rem",
                          paddingBottom: "0.5rem",
                          borderBottom: "2px solid var(--primary-light)",
                          textTransform: "capitalize",
                        }}
                      >
                        {category === "basic"
                          ? "📋 Basic Information"
                          : category === "physical"
                            ? "🏥 Physical Health"
                            : category === "medication"
                              ? "💊 Medications"
                              : category === "mental"
                                ? "🧠 Mental Wellbeing"
                                : category === "social"
                                  ? "👥 Social Connection"
                                  : category === "nutrition"
                                    ? "🍎 Nutrition & Hydration"
                                    : category === "cognitive"
                                      ? "🎯 Cognitive Function"
                                      : category === "safety"
                                        ? "⚠️ Safety Concerns"
                                        : category}
                      </h3>

                      {categoryQuestions.map((q) => {
                        if (q.condition && !q.condition(assessmentAnswers))
                          return null;

                        return (
                          <div key={q.id} style={{ marginBottom: "1.5rem" }}>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: 500,
                              }}
                            >
                              {q.icon} {q.label}
                            </label>

                            {q.type === "range" && (
                              <div>
                                <input
                                  type="range"
                                  min={q.min}
                                  max={q.max}
                                  step={q.step}
                                  value={assessmentAnswers[q.id] || q.default}
                                  onChange={(e) =>
                                    handleAnswerChange(
                                      q.id,
                                      parseFloat(e.target.value),
                                    )
                                  }
                                  style={{ width: "100%" }}
                                />
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.8rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  <span>
                                    {q.min}{" "}
                                    {q.id === "water" ? "glasses" : "hrs"}
                                  </span>
                                  <span style={{ fontWeight: "bold" }}>
                                    {assessmentAnswers[q.id] || q.default}{" "}
                                    {q.id === "water" ? "glasses" : "hrs"}
                                  </span>
                                  <span>
                                    {q.max}{" "}
                                    {q.id === "water" ? "glasses" : "hrs"}
                                  </span>
                                </div>
                              </div>
                            )}

                            {q.type === "select" && (
                              <select
                                value={assessmentAnswers[q.id] || q.default}
                                onChange={(e) =>
                                  handleAnswerChange(q.id, e.target.value)
                                }
                                className="form-control"
                                style={{
                                  background: "white",
                                  cursor: "pointer",
                                }}
                              >
                                {q.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {q.type === "boolean" && (
                              <div style={{ display: "flex", gap: "1rem" }}>
                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    value="true"
                                    checked={assessmentAnswers[q.id] === true}
                                    onChange={() =>
                                      handleAnswerChange(q.id, true)
                                    }
                                  />{" "}
                                  Yes
                                </label>
                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    value="false"
                                    checked={assessmentAnswers[q.id] === false}
                                    onChange={() =>
                                      handleAnswerChange(q.id, false)
                                    }
                                  />{" "}
                                  No
                                </label>
                              </div>
                            )}

                            {q.type === "multiselect" && (
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "0.5rem",
                                  marginTop: "0.5rem",
                                }}
                              >
                                {q.options.map((opt) => {
                                  const currentValues =
                                    assessmentAnswers[q.id] || [];
                                  const isSelected =
                                    currentValues.includes(opt);
                                  return (
                                    <motion.button
                                      key={opt}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        const newValues = isSelected
                                          ? currentValues.filter(
                                              (v) => v !== opt,
                                            )
                                          : [...currentValues, opt];
                                        handleAnswerChange(q.id, newValues);
                                      }}
                                      style={{
                                        padding: "8px 16px",
                                        borderRadius: "20px",
                                        border: `2px solid ${isSelected ? "var(--primary)" : "#e0e0e0"}`,
                                        background: isSelected
                                          ? "rgba(0, 122, 255, 0.1)"
                                          : "white",
                                        color: isSelected
                                          ? "var(--primary)"
                                          : "var(--text-muted)",
                                        cursor: "pointer",
                                        fontSize: "0.9rem",
                                        transition: "all 0.2s",
                                      }}
                                    >
                                      {opt}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  marginTop: "2rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #e0e0e0",
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAssessment(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitAssessment}
                  disabled={submitting}
                  style={{ opacity: submitting ? 0.6 : 1, minWidth: "100px" }}
                >
                  {submitting ? "Submitting..." : "Submit Assessment"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Dashboard;
