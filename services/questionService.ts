import {
    db, storage, ref, uploadString, getDownloadURL,
    collection, doc, setDoc, getDoc,
    serverTimestamp
} from './firebase';
import { getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { QuestionSegment, Subject } from '../types';
import { generateId } from '../utils/uuid';

const COLLECTION_QUESTIONS = 'questions';

export const questionService = {

    // --- Questions ---

    addQuestion: async (segment: QuestionSegment, base64Image: string): Promise<void> => {
        try {
            // 1. Upload Image to Firebase Storage
            const imageId = generateId();
            const storageRef = ref(storage, `questions/${segment.subject}/${imageId}.png`);

            // Remove header if present (data:image/png;base64,...)
            const cleanBase64 = base64Image.split(',')[1] || base64Image;

            await uploadString(storageRef, cleanBase64, 'base64', { contentType: 'image/png' });
            const downloadUrl = await getDownloadURL(storageRef);

            // 2. Save Metadata to Firestore
            const questionId = generateId();
            const questionData = {
                id: questionId,
                text: segment.text || "",
                subjectId: segment.subject || null, // Storing Name as ID for now to match current flow
                chapterId: segment.chapter || null,
                correctAnswer: segment.correctAnswer || null,
                imageUrl: downloadUrl,
                createdAt: serverTimestamp(),
                // Search helpers
                subject_lower: segment.subject?.toLowerCase() || null,
                chapter_lower: segment.chapter?.toLowerCase() || null
            };

            await setDoc(doc(db, COLLECTION_QUESTIONS, questionId), questionData);

        } catch (error) {
            console.error("Error adding question:", error);
            throw error;
        }
    },

    getQuestions: async (subjectId: string, chapterId?: string): Promise<QuestionSegment[]> => {
        try {
            const qRef = collection(db, COLLECTION_QUESTIONS);
            let q = query(qRef, where("subject_lower", "==", subjectId.toLowerCase()));

            if (chapterId && chapterId !== 'all') {
                q = query(q, where("chapterId", "==", chapterId));
            }

            // Limit to preventing fetching too many
            q = query(q, limit(100));

            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: data.id,
                    text: data.text,
                    subject: data.subjectId,
                    chapter: data.chapterId,
                    correctAnswer: data.correctAnswer,
                    cropUrl: data.imageUrl,
                    boundingBox: { ymin: 0, xmin: 0, ymax: 0, xmax: 0 } // Dummy, not needed for display
                } as QuestionSegment;
            });

        } catch (error) {
            console.error("Error fetching questions:", error);
            return [];
        }
    }
};
