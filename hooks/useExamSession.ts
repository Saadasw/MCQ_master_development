import { useState, useEffect, useRef } from 'react';
import { auth, db, signInAnonymously, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from '../services/firebase';
import { ExamSession, UserAnswer, DeviceInfo } from '../types';
import { generateId } from '../utils/uuid';

interface UseExamSessionProps {
    subjectId: string;
    chapterId?: string;
    totalQuestions: number;
    durationMinutes: number;
}

export const useExamSession = ({ subjectId, chapterId, totalQuestions, durationMinutes }: UseExamSessionProps) => {
    const [session, setSession] = useState<ExamSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Initialize Session
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Anonymous Auth
                const userCred = await signInAnonymously(auth);
                const uid = userCred.user.uid;
                setUserId(uid);

                // 2. Check for existing active session
                // We use a composite ID or query. For simplicity, let's assume one active exam per user for now
                // or store the current session ID in localStorage to recover it.
                const storedSessionId = localStorage.getItem(`exam_session_${subjectId}`);

                if (storedSessionId) {
                    const sessionRef = doc(db, 'exam_sessions', storedSessionId);
                    const sessionSnap = await getDoc(sessionRef);

                    if (sessionSnap.exists()) {
                        const data = sessionSnap.data() as ExamSession;
                        // Check if still valid (not completed and time remaining)
                        const now = Date.now();
                        const endTime = data.endTime.toMillis();

                        if (data.status === 'IN_PROGRESS' && now < endTime) {
                            console.log("Restoring existing session...");
                            setSession(data);
                            setLoading(false);
                            return;
                        }
                    }
                }

                // 3. Create New Session
                const newSessionId = generateId();
                const now = Timestamp.now();
                const endTime = Timestamp.fromMillis(now.toMillis() + (durationMinutes * 60 * 1000));

                const deviceInfo: DeviceInfo = {
                    userAgent: navigator.userAgent,
                    screenResolution: `${window.screen.width}x${window.screen.height}`,
                    language: navigator.language,
                    platform: navigator.platform
                };

                const newSession: ExamSession = {
                    id: newSessionId,
                    userId: uid,
                    subjectId,
                    chapterId,
                    deviceInfo,
                    createdAt: now,
                    lastActiveAt: now,
                    status: 'IN_PROGRESS',
                    startTime: now,
                    endTime: endTime,
                    answers: {},
                    totalQuestions
                };

                await setDoc(doc(db, 'exam_sessions', newSessionId), newSession);
                localStorage.setItem(`exam_session_${subjectId}`, newSessionId);
                setSession(newSession);

            } catch (err: any) {
                console.error("Session Init Error:", err);
                // Provide a user-friendly error message
                if (err.code === 'auth/admin-restricted-operation') {
                    setError("Authentication is not configured. Please enable Anonymous Authentication in Firebase Console.");
                } else {
                    setError(err.message || "Failed to initialize exam session.");
                }
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [subjectId, chapterId, durationMinutes]);

    // Sync Answer
    const saveAnswer = async (questionId: string | number, selectedOption: string) => {
        if (!session || !userId) return;

        // Optimistic Update
        const newAnswer: UserAnswer = {
            questionId,
            selectedOption,
            timestamp: Timestamp.now()
        };

        const updatedSession = {
            ...session,
            answers: {
                ...session.answers,
                [questionId]: newAnswer
            }
        };
        setSession(updatedSession);

        // Fire & Forget (or Debounce in production)
        try {
            const sessionRef = doc(db, 'exam_sessions', session.id);
            await updateDoc(sessionRef, {
                [`answers.${questionId}`]: newAnswer,
                lastActiveAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to save answer:", err);
            // Ideally show a toast or retry
        }
    };

    // Finish Exam
    const finishExam = async () => {
        if (!session) return;

        try {
            const sessionRef = doc(db, 'exam_sessions', session.id);
            await updateDoc(sessionRef, {
                status: 'COMPLETED',
                lastActiveAt: serverTimestamp()
            });
            setSession(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
            localStorage.removeItem(`exam_session_${subjectId}`);
        } catch (err) {
            console.error("Failed to finish exam:", err);
        }
    };

    return { session, loading, error, saveAnswer, finishExam };
};
