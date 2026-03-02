"use client";


import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HeaderWithBack from "@/components/HeaderWithBack";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useVerification } from "@/contexts/VerificationContext";
import { jsPDF } from "jspdf";
import {
    detectQuadrilateral, perspectiveCrop, areCornersStable, lerpCorners,
    type Point, type DetectionResult
} from "@/lib/documentScanner";

function IdentityVerificationContent() {
    const { user, isAuthenticated, activeRole } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetRole = searchParams.get("role");
    const { data: contextData, updateData, isSubmitting: isSubmittingContext } = useVerification();
    
    // Camera Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const requestRef = useRef<number | null>(null);
    const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Personal Info
    const [firstName, setFirstName] = useState(contextData.firstName || "");
    const [lastName, setLastName] = useState(contextData.lastName || "");
    const [fatherName, setFatherName] = useState(contextData.fatherName || "");
    const [motherName, setMotherName] = useState(contextData.motherName || "");
    const [dateOfBirth, setDateOfBirth] = useState(contextData.dateOfBirth || "");

    // Files (supporting multiple)
    const [frontImages, setFrontImages] = useState<string[]>(contextData.frontImages);
    const [backImages, setBackImages] = useState<string[]>(contextData.backImages);
    const [traderRegDocs, setTraderRegDocs] = useState<string[]>(contextData.traderRegDocs);
    const [chamberRegDocs, setChamberRegDocs] = useState<string[]>(contextData.chamberRegDocs);
    
    // === PROFESSIONAL DOCUMENT SCANNER STATE ===
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [activeCameraSetter, setActiveCameraSetter] = useState<React.Dispatch<React.SetStateAction<string[]>> | null>(null);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    
    // Scanner phase: searching → tracking → ready → capturing → adjusting → preview
    type ScanPhase = 'searching' | 'tracking' | 'ready' | 'capturing' | 'adjusting' | 'preview';
    const [scanPhase, setScanPhase] = useState<ScanPhase>('searching');
    const scanPhaseRef = useRef<ScanPhase>('searching');
    
    // UI corner positions as fractions [0..1] for display
    const [uiCorners, setUiCorners] = useState<[Point, Point, Point, Point]>([
        { x: 0.10, y: 0.20 }, { x: 0.90, y: 0.20 },
        { x: 0.10, y: 0.80 }, { x: 0.90, y: 0.80 }
    ]);
    
    // Detection refs (mutable, used inside animation loop)
    const isActiveRef = useRef(false);
    const lastProcessTime = useRef<number>(0);
    const smoothedCornersRef = useRef<[Point, Point, Point, Point]>([
        { x: 32, y: 48 }, { x: 288, y: 48 },
        { x: 32, y: 192 }, { x: 288, y: 192 }
    ]);
    const lastDetectionRef = useRef<DetectionResult | null>(null);
    const stableStartRef = useRef<number>(0);
    const stabilityDuration = 500;
    
    // Countdown
    const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isCountingRef = useRef(false);
    
    // === MANUAL CORNER ADJUSTMENT ===
    const [rawFrame, setRawFrame] = useState<string | null>(null); // full camera frame (uncropped)
    const [adjustCorners, setAdjustCorners] = useState<[Point, Point, Point, Point]>([
        { x: 0.10, y: 0.10 }, { x: 0.90, y: 0.10 },
        { x: 0.10, y: 0.90 }, { x: 0.90, y: 0.90 }
    ]); // corners as fractions [0..1] of the raw frame
    const [draggingCorner, setDraggingCorner] = useState<number | null>(null);
    const adjustImageRef = useRef<HTMLImageElement>(null);
    
    // Post-capture preview
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showExportDialog, setShowExportDialog] = useState(false);
    
    // === POST-CAPTURE ENHANCEMENTS ===
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [imageRotation, setImageRotation] = useState(0); // degrees: 0, 90, 180, 270
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Detection canvas dimensions (constants)
    const DET_W = 320, DET_H = 240;

    // Detailed Trader fields
    const [taxId, setTaxId] = useState(contextData.taxId);
    const [registrationNumber, setRegistrationNumber] = useState(contextData.registrationNumber);
    const [businessName, setBusinessName] = useState(contextData.businessName);
    const [issueDate, setIssueDate] = useState(contextData.issueDate);
    const [expiryDate, setExpiryDate] = useState(contextData.expiryDate);
    const [chamberRegistrationNumber, setChamberRegistrationNumber] = useState(contextData.chamberRegistrationNumber);
    const [chamberSerialNumber, setChamberSerialNumber] = useState(contextData.chamberSerialNumber);
    const [chamberMembershipYear, setChamberMembershipYear] = useState(contextData.chamberMembershipYear);
    
    // Client specific fields
    const [licensePlate, setLicensePlate] = useState(contextData.licensePlate);
    const [vehicleType, setVehicleType] = useState(contextData.vehicleType);
    const [vehicleColor, setVehicleColor] = useState(contextData.vehicleColor);
    const [governorate, setGovernorate] = useState(contextData.governorate || "دمشق");

    const [isLoading, setIsLoading] = useState(false);
    const isTrader = activeRole === "TRADER" || targetRole === "TRADER";
    const isDriver = activeRole === "DRIVER" || targetRole === "DRIVER";

    const isFormValid = !!(firstName && lastName && dateOfBirth && frontImages.length > 0);

    useEffect(() => {
        if (user && !firstName) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setBusinessName(user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "");
        }
    }, [user, firstName]);

    // Sync state back to context
    useEffect(() => {
        updateData({
            firstName, lastName, fatherName, motherName, dateOfBirth,
            frontImages, backImages, traderRegDocs, chamberRegDocs,
            taxId, registrationNumber, businessName, issueDate, expiryDate,
            chamberRegistrationNumber, chamberSerialNumber, chamberMembershipYear,
            licensePlate, vehicleType, vehicleColor, governorate
        });
    }, [
        firstName, lastName, fatherName, motherName, dateOfBirth,
        frontImages, backImages, traderRegDocs, chamberRegDocs,
        taxId, registrationNumber, businessName, issueDate, expiryDate,
        chamberRegistrationNumber, chamberSerialNumber, chamberMembershipYear,
        licensePlate, vehicleType, vehicleColor, governorate, updateData
    ]);

    const handleNext = () => {
        // Validation check
        if (!firstName || !lastName || !dateOfBirth || frontImages.length === 0) {
            addToast("يرجى إكمال البيانات الأساسية وصور الهوية", "error");
            return;
        }
        
        router.push(`/verification/license?role=${targetRole || ""}`);
    };

    // === PROFESSIONAL DOCUMENT SCANNER - DETECTION LOOP ===
    const detectDocument = (now: number) => {
        if (!videoRef.current || !isActiveRef.current) return;
        
        // Throttle to ~15 FPS
        if (now - lastProcessTime.current > 66) {
            lastProcessTime.current = now;
            const video = videoRef.current;
            
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                if (!detectionCanvasRef.current) {
                    detectionCanvasRef.current = document.createElement("canvas");
                }
                const detCanvas = detectionCanvasRef.current;
                const detCtx = detCanvas.getContext("2d", { willReadFrequently: true });
                
                if (detCtx) {
                    detCanvas.width = DET_W;
                    detCanvas.height = DET_H;
                    detCtx.drawImage(video, 0, 0, DET_W, DET_H);
                    
                    const imgData = detCtx.getImageData(0, 0, DET_W, DET_H);
                    
                    // === CV PIPELINE ===
                    const result = detectQuadrilateral(imgData, DET_W, DET_H);
                    
                    // Debug: log every ~2 seconds
                    if (!((now | 0) % 2000 < 70)) {
                        // skip
                    } else {
                        if (result) {
                            console.log('[DocScan] DETECTED:', JSON.stringify(result.corners.map(c => ({x: Math.round(c.x), y: Math.round(c.y)}))), 'area:', (result.area * 100).toFixed(1) + '%');
                        } else {
                            console.log('[DocScan] No document found');
                        }
                    }
                    
                    if (result && result.isValid) {
                        // Smooth the detected corners (lerp)
                        const smoothed = lerpCorners(smoothedCornersRef.current, result.corners, 0.35);
                        smoothedCornersRef.current = smoothed;
                        
                        // Update UI corners (as fractions)
                        const nextUi: [Point, Point, Point, Point] = [
                            { x: smoothed[0].x / DET_W, y: smoothed[0].y / DET_H },
                            { x: smoothed[1].x / DET_W, y: smoothed[1].y / DET_H },
                            { x: smoothed[2].x / DET_W, y: smoothed[2].y / DET_H },
                            { x: smoothed[3].x / DET_W, y: smoothed[3].y / DET_H }
                        ];
                        setUiCorners(nextUi);
                        
                        // Check stability: are corners stable for >= 500ms?
                        const prevDetection = lastDetectionRef.current;
                        if (prevDetection && areCornersStable(prevDetection.corners, result.corners, 8)) {
                            // Corners are stable
                            if (stableStartRef.current === 0) {
                                stableStartRef.current = now; // start stability timer
                            }
                            
                            const stableDuration = now - stableStartRef.current;
                            
                            if (stableDuration >= stabilityDuration) {
                                // === READY PHASE ===
                                if (scanPhaseRef.current !== 'ready' && scanPhaseRef.current !== 'capturing') {
                                    scanPhaseRef.current = 'ready';
                                    setScanPhase('ready');
                                    
                                    // Start auto-capture countdown
                                    if (!isCountingRef.current) {
                                        isCountingRef.current = true;
                                        let count = 3;
                                        setCaptureCountdown(count);
                                        countdownTimerRef.current = setInterval(() => {
                                            count -= 1;
                                            if (count <= 0) {
                                                if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                                                setCaptureCountdown(null);
                                                scanPhaseRef.current = 'capturing';
                                                setScanPhase('capturing');
                                                
                                                // === CAPTURE RAW FRAME → go to adjusting ===
                                                setTimeout(() => {
                                                    if (videoRef.current) {
                                                        const vid = videoRef.current;
                                                        const rawCnv = document.createElement('canvas');
                                                        rawCnv.width = vid.videoWidth;
                                                        rawCnv.height = vid.videoHeight;
                                                        rawCnv.getContext('2d')!.drawImage(vid, 0, 0);
                                                        const rawDataUrl = rawCnv.toDataURL('image/png');
                                                        setRawFrame(rawDataUrl);
                                                        // Set adjust corners from detected corners (as fractions)
                                                        const sc = smoothedCornersRef.current;
                                                        setAdjustCorners([
                                                            { x: sc[0].x / DET_W, y: sc[0].y / DET_H },
                                                            { x: sc[1].x / DET_W, y: sc[1].y / DET_H },
                                                            { x: sc[2].x / DET_W, y: sc[2].y / DET_H },
                                                            { x: sc[3].x / DET_W, y: sc[3].y / DET_H }
                                                        ]);
                                                        scanPhaseRef.current = 'adjusting';
                                                        setScanPhase('adjusting');
                                                        isActiveRef.current = false;
                                                    }
                                                }, 100);
                                            } else {
                                                setCaptureCountdown(count);
                                            }
                                        }, 1000);
                                    }
                                }
                            } else {
                                // Stable but not long enough → tracking
                                if (scanPhaseRef.current === 'searching') {
                                    scanPhaseRef.current = 'tracking';
                                    setScanPhase('tracking');
                                }
                            }
                        } else {
                            // Corners moved → reset stability
                            stableStartRef.current = 0;
                            if (scanPhaseRef.current !== 'searching') {
                                scanPhaseRef.current = 'tracking';
                                setScanPhase('tracking');
                            }
                            // Cancel countdown if running
                            if (isCountingRef.current) {
                                if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                                isCountingRef.current = false;
                                setCaptureCountdown(null);
                            }
                        }
                        
                        lastDetectionRef.current = result;
                    } else {
                        // No document detected → searching
                        if (scanPhaseRef.current !== 'searching') {
                            scanPhaseRef.current = 'searching';
                            setScanPhase('searching');
                        }
                        stableStartRef.current = 0;
                        lastDetectionRef.current = null;
                        
                        // Cancel countdown
                        if (isCountingRef.current) {
                            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                            isCountingRef.current = false;
                            setCaptureCountdown(null);
                        }
                    }
                }
            }
        }
        
        requestRef.current = requestAnimationFrame(detectDocument);
    };

    // Attach stream when camera opens
    useEffect(() => {
        if (isCameraOpen && cameraStream && videoRef.current) {
            const video = videoRef.current;
            video.srcObject = cameraStream;
            isActiveRef.current = true;
            
            // Reset all detection state
            scanPhaseRef.current = 'searching';
            setScanPhase('searching');
            smoothedCornersRef.current = [
                { x: 32, y: 48 }, { x: 288, y: 48 },
                { x: 32, y: 192 }, { x: 288, y: 192 }
            ];
            lastDetectionRef.current = null;
            stableStartRef.current = 0;
            isCountingRef.current = false;
            setCapturedImage(null);
            setShowExportDialog(false);
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

            const handleReady = () => {
                setIsCameraLoading(false);
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
                requestRef.current = requestAnimationFrame(detectDocument);
            };

            video.onloadedmetadata = async () => {
                try { await video.play(); handleReady(); } catch(e) { console.error(e); }
            };
            if (video.readyState >= 2) handleReady();
        }
        return () => { 
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isCameraOpen, cameraStream]);

    const startCamera = async (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        try {
            setIsCameraLoading(true);
            setActiveCameraSetter(() => setter);
            setIsCameraOpen(true);

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: { ideal: "environment" },
                    width: { ideal: 3840 },
                    height: { ideal: 2160 }
                },
                audio: false 
            });
            setCameraStream(stream);
        } catch (err) {
            console.error("Camera error:", err);
            setIsCameraOpen(false);
            setIsCameraLoading(false);
            addToast("تعذر الوصول إلى الكاميرا. يرجى التحقق من الأذونات.", "error");
        }
    };

    const stopCamera = () => {
        isActiveRef.current = false;
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
        isCountingRef.current = false;
        stableStartRef.current = 0;
        lastDetectionRef.current = null;
        scanPhaseRef.current = 'searching';
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCameraOpen(false);
        setIsCameraLoading(false);
        setActiveCameraSetter(null);
        setScanPhase('searching');
        setCaptureCountdown(null);
        setCapturedImage(null);
        setRawFrame(null);
        setShowExportDialog(false);
        setIsFlashOn(false);
        setImageRotation(0);
        setIsProcessing(false);
    };

    // Save captured document image
    const saveDocument = (format: 'image' | 'pdf') => {
        if (!capturedImage || !activeCameraSetter) return;
        
        if (format === 'pdf') {
            // Generate real PDF using jsPDF
            try {
                const img = new Image();
                img.onload = () => {
                    const pdf = new jsPDF({
                        orientation: img.width > img.height ? 'landscape' : 'portrait',
                        unit: 'px',
                        format: [img.width, img.height]
                    });
                    pdf.addImage(capturedImage, 'PNG', 0, 0, img.width, img.height);
                    const pdfBlob = pdf.output('blob');
                    const url = URL.createObjectURL(pdfBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `document_${Date.now()}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    // Also save the image in the state
                    activeCameraSetter(prev => [...prev, capturedImage]);
                    addToast("تم حفظ المستند كـ PDF بنجاح ✓", "success");
                    stopCamera();
                };
                img.src = capturedImage;
            } catch {
                addToast("فشل في إنشاء PDF", "error");
            }
        } else {
            activeCameraSetter(prev => [...prev, capturedImage]);
            addToast("تم حفظ صورة المستند بنجاح ✓", "success");
            stopCamera();
        }
    };

    // === FLASH TOGGLE ===
    const toggleFlash = async () => {
        if (!cameraStream) return;
        const track = cameraStream.getVideoTracks()[0];
        if (!track) return;
        try {
            const newFlash = !isFlashOn;
            await track.applyConstraints({
                advanced: [{ torch: newFlash } as MediaTrackConstraintSet]
            });
            setIsFlashOn(newFlash);
        } catch {
            addToast("الفلاش غير متوفر في هذا الجهاز", "error");
        }
    };

    // === IMAGE ROTATION (90° increments) ===
    const rotateImage90 = () => {
        if (!capturedImage) return;
        setIsProcessing(true);
        const img = new Image();
        img.onload = () => {
            const cnv = document.createElement('canvas');
            cnv.width = img.height;
            cnv.height = img.width;
            const ctx = cnv.getContext('2d')!;
            ctx.translate(cnv.width / 2, cnv.height / 2);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            setCapturedImage(cnv.toDataURL('image/png'));
            setImageRotation((imageRotation + 90) % 360);
            setIsProcessing(false);
        };
        img.src = capturedImage;
    };

    // === SHADOW REMOVAL (adaptive brightness normalization) ===
    const removeShadows = () => {
        if (!capturedImage) return;
        setIsProcessing(true);
        const img = new Image();
        img.onload = () => {
            const cnv = document.createElement('canvas');
            cnv.width = img.width;
            cnv.height = img.height;
            const ctx = cnv.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, cnv.width, cnv.height);
            const d = data.data;
            
            // Compute local average brightness in blocks
            const bw = 32; // block size
            const cols = Math.ceil(cnv.width / bw);
            const rows = Math.ceil(cnv.height / bw);
            const blockAvg = new Float32Array(cols * rows);
            
            for (let by = 0; by < rows; by++) {
                for (let bx = 0; bx < cols; bx++) {
                    let sum = 0, count = 0;
                    const x0 = bx * bw, y0 = by * bw;
                    const x1 = Math.min(x0 + bw, cnv.width);
                    const y1 = Math.min(y0 + bw, cnv.height);
                    for (let y = y0; y < y1; y++) {
                        for (let x = x0; x < x1; x++) {
                            const i = (y * cnv.width + x) * 4;
                            sum += (d[i] + d[i+1] + d[i+2]) / 3;
                            count++;
                        }
                    }
                    blockAvg[by * cols + bx] = sum / count;
                }
            }
            
            // Global average
            const globalAvg = blockAvg.reduce((a, b) => a + b, 0) / blockAvg.length;
            
            // Normalize each pixel by its local block average
            for (let y = 0; y < cnv.height; y++) {
                for (let x = 0; x < cnv.width; x++) {
                    const bx = Math.min(Math.floor(x / bw), cols - 1);
                    const by = Math.min(Math.floor(y / bw), rows - 1);
                    const localAvg = blockAvg[by * cols + bx];
                    const scale = localAvg > 10 ? globalAvg / localAvg : 1;
                    const i = (y * cnv.width + x) * 4;
                    d[i]   = Math.min(255, Math.round(d[i] * scale));
                    d[i+1] = Math.min(255, Math.round(d[i+1] * scale));
                    d[i+2] = Math.min(255, Math.round(d[i+2] * scale));
                }
            }
            ctx.putImageData(data, 0, 0);
            setCapturedImage(cnv.toDataURL('image/png'));
            setIsProcessing(false);
            addToast("تم إزالة الظل ✓", "success");
        };
        img.src = capturedImage;
    };

    // === GLARE REMOVAL (highlight suppression) ===
    const removeGlare = () => {
        if (!capturedImage) return;
        setIsProcessing(true);
        const img = new Image();
        img.onload = () => {
            const cnv = document.createElement('canvas');
            cnv.width = img.width;
            cnv.height = img.height;
            const ctx = cnv.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, cnv.width, cnv.height);
            const d = data.data;
            const len = d.length;
            
            // Detect glare: pixels where all channels are very bright and close to each other
            const glareThreshold = 220;
            const channelDiffMax = 30;
            
            // First pass: detect glare mask
            const mask = new Uint8Array(cnv.width * cnv.height);
            for (let i = 0; i < len; i += 4) {
                const r = d[i], g = d[i+1], b = d[i+2];
                const mn = Math.min(r, g, b);
                const mx = Math.max(r, g, b);
                if (mn > glareThreshold && (mx - mn) < channelDiffMax) {
                    mask[i / 4] = 1;
                }
            }
            
            // Second pass: replace glare pixels with average of nearby non-glare pixels
            const radius = 8;
            for (let y = 0; y < cnv.height; y++) {
                for (let x = 0; x < cnv.width; x++) {
                    const idx = y * cnv.width + x;
                    if (mask[idx] === 1) {
                        let sr = 0, sg = 0, sb = 0, cnt = 0;
                        for (let dy = -radius; dy <= radius; dy++) {
                            for (let dx = -radius; dx <= radius; dx++) {
                                const nx = x + dx, ny = y + dy;
                                if (nx >= 0 && nx < cnv.width && ny >= 0 && ny < cnv.height) {
                                    const ni = ny * cnv.width + nx;
                                    if (mask[ni] === 0) {
                                        const pi = ni * 4;
                                        sr += d[pi]; sg += d[pi+1]; sb += d[pi+2];
                                        cnt++;
                                    }
                                }
                            }
                        }
                        if (cnt > 0) {
                            const pi = idx * 4;
                            d[pi]   = Math.round(sr / cnt);
                            d[pi+1] = Math.round(sg / cnt);
                            d[pi+2] = Math.round(sb / cnt);
                        }
                    }
                }
            }
            ctx.putImageData(data, 0, 0);
            setCapturedImage(cnv.toDataURL('image/png'));
            setIsProcessing(false);
            addToast("تم إزالة انعكاس الفلاش ✓", "success");
        };
        img.src = capturedImage;
    };

    // Retake photo
    const retakePhoto = () => {
        setCapturedImage(null);
        setRawFrame(null);
        setShowExportDialog(false);
        setImageRotation(0);
        setIsProcessing(false);
        scanPhaseRef.current = 'searching';
        setScanPhase('searching');
        stableStartRef.current = 0;
        lastDetectionRef.current = null;
        isCountingRef.current = false;
        isActiveRef.current = true;
        requestRef.current = requestAnimationFrame(detectDocument);
    };

    const takePhoto = () => {
        if (videoRef.current && activeCameraSetter) {
            const video = videoRef.current;
            if (video.videoWidth > 0 && video.readyState >= 2) {
                // Always capture raw frame and go to manual adjustment
                const rawCnv = document.createElement('canvas');
                rawCnv.width = video.videoWidth;
                rawCnv.height = video.videoHeight;
                rawCnv.getContext('2d')!.drawImage(video, 0, 0);
                const rawDataUrl = rawCnv.toDataURL('image/png');
                setRawFrame(rawDataUrl);
                
                // Set corners from detection if available, else default
                if (lastDetectionRef.current && lastDetectionRef.current.isValid) {
                    const sc = smoothedCornersRef.current;
                    setAdjustCorners([
                        { x: sc[0].x / DET_W, y: sc[0].y / DET_H },
                        { x: sc[1].x / DET_W, y: sc[1].y / DET_H },
                        { x: sc[2].x / DET_W, y: sc[2].y / DET_H },
                        { x: sc[3].x / DET_W, y: sc[3].y / DET_H }
                    ]);
                } else {
                    setAdjustCorners([
                        { x: 0.10, y: 0.10 }, { x: 0.90, y: 0.10 },
                        { x: 0.10, y: 0.90 }, { x: 0.90, y: 0.90 }
                    ]);
                }
                scanPhaseRef.current = 'adjusting';
                setScanPhase('adjusting');
                isActiveRef.current = false;
            } else {
                addToast("يرجى الانتظار حتى تظهر صورة الكاميرا وتستقر", "error");
            }
        }
    };

    // === CROP FROM RAW FRAME using adjusted corners ===
    const cropFromRawFrame = () => {
        if (!rawFrame) return;
        const img = new Image();
        img.onload = () => {
            // Calculate crop dimensions from corners (use native camera resolution)
            const corners = adjustCorners.map(c => ({
                x: c.x * img.width,
                y: c.y * img.height
            }));
            const [tl, tr, bl, br] = corners;
            
            // Output size = max side lengths for full quality
            const topW = Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2);
            const botW = Math.sqrt((br.x - bl.x) ** 2 + (br.y - bl.y) ** 2);
            const leftH = Math.sqrt((bl.x - tl.x) ** 2 + (bl.y - tl.y) ** 2);
            const rightH = Math.sqrt((br.x - tr.x) ** 2 + (br.y - tr.y) ** 2);
            const outW = Math.round(Math.max(topW, botW));
            const outH = Math.round(Math.max(leftH, rightH));
            
            // Source canvas
            const srcCnv = document.createElement('canvas');
            srcCnv.width = img.width;
            srcCnv.height = img.height;
            const srcCtx = srcCnv.getContext('2d')!;
            srcCtx.drawImage(img, 0, 0);
            const srcData = srcCtx.getImageData(0, 0, img.width, img.height);
            
            // Output canvas
            const outCnv = document.createElement('canvas');
            outCnv.width = outW;
            outCnv.height = outH;
            const outCtx = outCnv.getContext('2d')!;
            const dstData = outCtx.createImageData(outW, outH);
            
            // Bilinear perspective warp (sub-pixel interpolation for sharp text)
            const srcW = img.width;
            const srcH = img.height;
            for (let dy = 0; dy < outH; dy++) {
                const v = dy / Math.max(1, outH - 1);
                for (let dx = 0; dx < outW; dx++) {
                    const u = dx / Math.max(1, outW - 1);
                    const sx = (1-u)*(1-v)*tl.x + u*(1-v)*tr.x + (1-u)*v*bl.x + u*v*br.x;
                    const sy = (1-u)*(1-v)*tl.y + u*(1-v)*tr.y + (1-u)*v*bl.y + u*v*br.y;
                    
                    // Bilinear interpolation
                    const x0 = Math.floor(sx);
                    const y0 = Math.floor(sy);
                    const x1 = Math.min(x0 + 1, srcW - 1);
                    const y1 = Math.min(y0 + 1, srcH - 1);
                    const fx = sx - x0;
                    const fy = sy - y0;
                    
                    if (x0 >= 0 && x0 < srcW && y0 >= 0 && y0 < srcH) {
                        const i00 = (y0 * srcW + x0) * 4;
                        const i10 = (y0 * srcW + x1) * 4;
                        const i01 = (y1 * srcW + x0) * 4;
                        const i11 = (y1 * srcW + x1) * 4;
                        const di = (dy * outW + dx) * 4;
                        
                        for (let c = 0; c < 3; c++) {
                            const v00 = srcData.data[i00 + c];
                            const v10 = srcData.data[i10 + c];
                            const v01 = srcData.data[i01 + c];
                            const v11 = srcData.data[i11 + c];
                            dstData.data[di + c] = Math.round(
                                v00 * (1-fx) * (1-fy) +
                                v10 * fx * (1-fy) +
                                v01 * (1-fx) * fy +
                                v11 * fx * fy
                            );
                        }
                        dstData.data[di + 3] = 255;
                    }
                }
            }
            outCtx.putImageData(dstData, 0, 0);
            setCapturedImage(outCnv.toDataURL('image/png'));
            scanPhaseRef.current = 'preview';
            setScanPhase('preview');
        };
        img.src = rawFrame;
    };

    // === CORNER DRAG HANDLERS (touch + mouse) ===
    const handleCornerPointerDown = (idx: number, e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingCorner(idx);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleCornerPointerMove = (e: React.PointerEvent) => {
        if (draggingCorner === null || !adjustImageRef.current) return;
        e.preventDefault();
        // Use the image element's bounding rect for accurate coordinates
        const rect = adjustImageRef.current.getBoundingClientRect();
        const x = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height));
        setAdjustCorners(prev => {
            const next = [...prev] as [Point, Point, Point, Point];
            next[draggingCorner] = { x, y };
            return next;
        });
    };

    const handleCornerPointerUp = () => {
        setDraggingCorner(null);
    };

    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const validTypes = ["image/jpeg", "image/png", "image/jpg"];

        setIsUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!validTypes.includes(file.type)) {
                    addToast(`نوع الملف ${file.name} غير مدعوم. استخدم JPG, PNG`, "error");
                    continue;
                }

                if (file.size > 10 * 1024 * 1024) {
                    addToast(`حجم الملف ${file.name} يجب أن يكون أقل من 10MB`, "error");
                    continue;
                }

                const formData = new FormData();
                formData.append("file", file);
                
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const result = await res.json();
                
                if (result.success) {
                    setter((prev) => [...prev, result.url]);
                } else {
                    addToast(result.error || "خطأ في رفع الملف", "error");
                }
            }
        } catch (err) {
            addToast("تعذر الاتصال بالخادم لرفع الملف", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <>
            <HeaderWithBack title="تحقق من الهوية" />

            <main className="flex-col pb-28">
                <div className="w-full px-6 py-5 bg-bg-dark">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="h-1.5 w-16 rounded-full bg-primary"></div>
                        <div className="h-1.5 w-16 rounded-full bg-primary"></div>
                        <div className="h-1.5 w-16 rounded-full bg-slate-700"></div>
                    </div>
                </div>

                <div className="px-5 mb-6">
                    <h1 className="text-2xl font-black text-white mb-1">
                        {isTrader ? "Identity Verification" : (isDriver ? "Driver Verification" : "Client Verification")}
                    </h1>
                    <p className="text-base text-slate-400 mb-1">
                        {isTrader ? "التحقق من الهوية (تاجر موثق)" : (isDriver ? "توثيق هوية السائق (الحصول على شارة سائق موثق)" : "توثيق حساب العميل (الحصول على شارة موثق ومعروف)")}
                    </p>
                    
                    {/* Quality Guidelines (New) */}
                    <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl flex gap-3">
                        <span className="material-symbols-outlined text-primary shrink-0">info</span>
                        <div>
                            <p className="text-[11px] font-bold text-white mb-1">تعليمات جودة الصورة:</p>
                            <ul className="text-[10px] text-slate-400 space-y-1 list-disc pr-4">
                                <li>تأكد من أن جميع زوايا المستند واضحة وتظهر داخل الإطار.</li>
                                <li>تجنب استخدام الفلاش لتفادي الانعكاسات الضوئية على المستند.</li>
                                <li>التقط الصورة في مكان ذو إضاءة جيدة لضمان وضوح النصوص.</li>
                                <li>يجب أن تكون المعلومات مقروءة وغير مهتزة أو مشوشة.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="px-5 flex flex-col gap-6">
                    {/* Personal Information */}
                    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary !text-[22px]">person</span>
                            <h3 className="text-base font-bold text-white">البيانات الشخصية</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 mb-1 mr-2">الاسم</p>
                                <input
                                    title="الاسم"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="الاسم"
                                    className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition"
                                />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 mb-1 mr-2">الكنية</p>
                                <input
                                    title="الكنية"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="الكنية"
                                    className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 mb-1 mr-2">اسم الأب</p>
                                <input
                                    title="اسم الأب"
                                    type="text"
                                    value={fatherName}
                                    onChange={(e) => setFatherName(e.target.value)}
                                    placeholder="اسم الأب"
                                    className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition"
                                />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 mb-1 mr-2">اسم الأم</p>
                                <input
                                    title="اسم الأم"
                                    type="text"
                                    value={motherName}
                                    onChange={(e) => setMotherName(e.target.value)}
                                    placeholder="اسم الأم"
                                    className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition"
                                />
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-500 mb-1 mr-2">تاريخ الميلاد</p>
                            <input
                                title="تاريخ الميلاد"
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition"
                            />
                        </div>
                    </div>

                    {/* ID Uploads */}
                    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary !text-[22px]">badge</span>
                            <h3 className="text-base font-bold text-white">الهوية الوطنية</h3>
                        </div>

                        <div className="grid gap-6">
                            {/* Front Side */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 mb-3">الوجه الأمامي للمستند</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-dark border border-slate-700 cursor-pointer hover:border-primary/50 transition group h-28">
                                        <span className="material-symbols-outlined text-primary !text-[32px]">upload_file</span>
                                        <span className="text-[10px] font-bold text-white">تحميل ملف</span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, setFrontImages)}
                                        />
                                    </label>
                                    <button 
                                        onClick={() => startCamera(setFrontImages)}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-dark border border-slate-700 cursor-pointer hover:border-primary/50 transition group h-28"
                                    >
                                        <span className="material-symbols-outlined text-primary !text-[32px]">photo_camera</span>
                                        <span className="text-[10px] font-bold text-white">التقاط صورة</span>
                                    </button>
                                </div>
                                
                                {frontImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {frontImages.map((img, idx) => (
                                            <div key={idx} className="relative size-20 rounded-lg overflow-hidden border border-slate-700 group">
                                                <img src={img} className="w-full h-full object-cover" alt="front" />
                                                <button 
                                                    onClick={() => handleRemoveFile(idx, setFrontImages)}
                                                    className="absolute inset-0 bg-red-500/80 items-center justify-center flex opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <span className="material-symbols-outlined text-white !text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Back Side */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 mb-3">الوجه الخلفي للمستند</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-dark border border-slate-700 cursor-pointer hover:border-primary/50 transition group h-28">
                                        <span className="material-symbols-outlined text-primary !text-[32px]">upload_file</span>
                                        <span className="text-[10px] font-bold text-white">تحميل ملف</span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, setBackImages)}
                                        />
                                    </label>
                                    <button 
                                        onClick={() => startCamera(setBackImages)}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-dark border border-slate-700 cursor-pointer hover:border-primary/50 transition group h-28"
                                    >
                                        <span className="material-symbols-outlined text-primary !text-[32px]">photo_camera</span>
                                        <span className="text-[10px] font-bold text-white">التقاط صورة</span>
                                    </button>
                                </div>

                                {backImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {backImages.map((img, idx) => (
                                            <div key={idx} className="relative size-20 rounded-lg overflow-hidden border border-slate-700 group">
                                                <img src={img} className="w-full h-full object-cover" alt="back" />
                                                <button 
                                                    onClick={() => handleRemoveFile(idx, setBackImages)}
                                                    className="absolute inset-0 bg-red-500/80 items-center justify-center flex opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <span className="material-symbols-outlined text-white !text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isTrader ? (
                        <>
                            {/* Business Name */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary !text-[22px]">store</span>
                                    <h3 className="text-base font-bold text-white">اسم النشاط التجاري</h3>
                                </div>
                                <input
                                    title="اسم النشاط التجاري"
                                    type="text"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="أدخل اسم النشاط التجاري أو اسمك"
                                    className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition"
                                />
                            </div>


                            {/* Commercial Register / Trader Registration */}
                            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-[22px]">assignment_turned_in</span>
                                    <h3 className="text-base font-bold text-white">شهادة تسجيل تاجر / سجل تجاري (إلزامي)</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-dark border border-slate-700 cursor-pointer hover:border-primary/50 transition group h-24">
                                        <span className="material-symbols-outlined text-primary !text-[28px]">upload_file</span>
                                        <span className="text-[10px] font-bold text-white">تحميل ملف</span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, setTraderRegDocs)}
                                        />
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={() => startCamera(setTraderRegDocs)}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-dark border border-slate-700 cursor-pointer hover:border-primary/50 transition group h-24"
                                    >
                                        <span className="material-symbols-outlined text-primary !text-[28px]">photo_camera</span>
                                        <span className="text-[10px] font-bold text-white">التقاط صورة</span>
                                    </button>
                                </div>

                                {traderRegDocs.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        {traderRegDocs.map((doc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-surface-dark border border-slate-700 rounded-lg group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <span className="material-symbols-outlined text-slate-500">description</span>
                                                    <span className="text-xs text-white truncate max-w-[200px]">مستند تسجيل #{idx+1}</span>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveFile(idx, setTraderRegDocs)}
                                                    className="text-red-500 hover:text-red-400 px-2"
                                                >
                                                    <span className="material-symbols-outlined !text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid gap-3">
                                    <input
                                        id="registrationNumber"
                                        aria-label="رقم السجل التجاري"
                                        type="text"
                                        value={registrationNumber}
                                        onChange={(e) => setRegistrationNumber(e.target.value)}
                                        placeholder="مسجل في السجل التجاري رقم ..."
                                        className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition"
                                    />
                                    
                                    <select
                                        title="المحافظة"
                                        value={governorate}
                                        onChange={(e) => setGovernorate(e.target.value)}
                                        className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition appearance-none"
                                    >
                                        <option value="" disabled>صادر عن محافظة ...</option>
                                        <option value="دمشق">دمشق</option>
                                        <option value="ريف دمشق">ريف دمشق</option>
                                        <option value="حلب">حلب</option>
                                        <option value="حمص">حمص</option>
                                        <option value="حماة">حماة</option>
                                        <option value="اللاذقية">اللاذقية</option>
                                        <option value="طرطوس">طرطوس</option>
                                        <option value="إدلب">إدلب</option>
                                        <option value="الرقة">الرقة</option>
                                        <option value="دير الزور">دير الزور</option>
                                        <option value="الحسكة">الحسكة</option>
                                        <option value="درعا">درعا</option>
                                        <option value="السويداء">السويداء</option>
                                        <option value="القنيطرة">القنيطرة</option>
                                    </select>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 mb-1 mr-2 block">تاريخ الإصدار</label>
                                            <input
                                                title="تاريخ الإصدار"
                                                type="date"
                                                value={issueDate}
                                                onChange={(e) => setIssueDate(e.target.value)}
                                                className="w-full bg-surface-dark border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 mb-1 mr-2 block">تاريخ الانتهاء</label>
                                            <input
                                                title="تاريخ الانتهاء"
                                                type="date"
                                                value={expiryDate}
                                                onChange={(e) => setExpiryDate(e.target.value)}
                                                className="w-full bg-surface-dark border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tax ID */}
                            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-[22px]">receipt_long</span>
                                    <h3 className="text-base font-bold text-white">الرقم الضريبي (إلزامي)</h3>
                                </div>
                                <input
                                    title="الرقم الضريبي"
                                    type="text"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                    placeholder="أدخل الرقم الضريبي ..."
                                    className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition"
                                />
                            </div>

                            {/* Chamber of Commerce Membership */}
                            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-[22px]">account_balance</span>
                                    <h3 className="text-base font-bold text-white">عضوية غرفة التجارة/الصناعة (إلزامي)</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-dark border border-slate-700 cursor-pointer hover:border-primary/50 transition group h-24">
                                        <span className="material-symbols-outlined text-primary !text-[28px]">upload_file</span>
                                        <span className="text-[10px] font-bold text-white">تحميل ملف</span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, setChamberRegDocs)}
                                        />
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={() => startCamera(setChamberRegDocs)}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-dark border border-slate-700 cursor-pointer hover:border-primary/50 transition group h-24"
                                    >
                                        <span className="material-symbols-outlined text-primary !text-[28px]">photo_camera</span>
                                        <span className="text-[10px] font-bold text-white">التقاط صورة</span>
                                    </button>
                                </div>

                                {chamberRegDocs.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        {chamberRegDocs.map((doc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-surface-dark border border-slate-700 rounded-lg group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <span className="material-symbols-outlined text-slate-500">description</span>
                                                    <span className="text-xs text-white truncate max-w-[200px]">شهادة عضوية #{idx+1}</span>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveFile(idx, setChamberRegDocs)}
                                                    className="text-red-500 hover:text-red-400 px-2"
                                                >
                                                    <span className="material-symbols-outlined !text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid gap-3 mt-2">
                                    <input
                                        title="رقم التسجيل في الغرفة"
                                        type="text"
                                        value={chamberRegistrationNumber}
                                        onChange={(e) => setChamberRegistrationNumber(e.target.value)}
                                        placeholder="رقم التسجيل في الغرفة ..."
                                        className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition"
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            title="الرقم المتسلسل"
                                            type="text"
                                            value={chamberSerialNumber}
                                            onChange={(e) => setChamberSerialNumber(e.target.value)}
                                            placeholder="الرقم المتسلسل"
                                            className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition"
                                        />
                                        <select
                                            title="سنة العضوية"
                                            value={chamberMembershipYear}
                                            onChange={(e) => setChamberMembershipYear(e.target.value)}
                                            className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition appearance-none"
                                        >
                                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary !text-[22px]">directions_car</span>
                                    <h3 className="text-base font-bold text-white">معلومات المركبة</h3>
                                </div>
                                <div className="grid gap-4">
                                    <input
                                        title="رقم اللوحة"
                                        type="text"
                                        value={licensePlate}
                                        onChange={(e) => setLicensePlate(e.target.value)}
                                        placeholder="رقم اللوحة (مثال: دمشق 123456)"
                                        className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            title="نوع المركبة"
                                            type="text"
                                            value={vehicleType}
                                            onChange={(e) => setVehicleType(e.target.value)}
                                            placeholder="نوع المركبة"
                                            className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition"
                                        />
                                        <input
                                            title="اللون"
                                            type="text"
                                            value={vehicleColor}
                                            onChange={(e) => setVehicleColor(e.target.value)}
                                            placeholder="اللون"
                                            className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition"
                                        />
                                    </div>
                                    <select
                                        title="المحافظة"
                                        value={governorate}
                                        onChange={(e) => setGovernorate(e.target.value)}
                                        className="w-full bg-surface-dark border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary transition appearance-none"
                                    >
                                        <option value="دمشق">دمشق</option>
                                        <option value="ريف دمشق">ريف دمشق</option>
                                        <option value="حلب">حلب</option>
                                        <option value="حمص">حمص</option>
                                        <option value="حماة">حماة</option>
                                        <option value="اللاذقية">اللاذقية</option>
                                        <option value="طرطوس">طرطوس</option>
                                        <option value="درعا">درعا</option>
                                        <option value="السويداء">السويداء</option>
                                        <option value="دير الزور">دير الزور</option>
                                        <option value="الحسكة">الحسكة</option>
                                        <option value="الرقة">الرقة</option>
                                        <option value="إدلب">إدلب</option>
                                        <option value="القنيطرة">القنيطرة</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex items-center justify-center gap-2 py-3">
                        <span className="material-symbols-outlined text-green-500 !text-[16px]">lock</span>
                        <span className="text-xs text-green-500/80 font-medium">بياناتك مشفرة وآمنة 100%</span>
                    </div>
                </div>
            </main>

            {/* Camera Overlay */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
                    <div className="relative w-full h-full flex flex-col">
                        {/* Header */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                            <button onClick={stopCamera} className="text-white">
                                <span className="material-symbols-outlined !text-[32px]">close</span>
                            </button>
                            <span className="text-white font-bold">التقاط صورة المستند</span>
                            <div className="w-8"></div>
                        </div>

                        {/* Video Feed */}
                        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                            {isCameraLoading && (
                                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black gap-4">
                                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                    <p className="text-white/60 text-xs">جاري تشغيل الكاميرا...</p>
                                </div>
                            )}

                            <video 
                                ref={videoRef}
                                autoPlay 
                                playsInline 
                                muted
                                className={`w-full h-full object-cover transition-opacity duration-700 ${isCameraLoading ? "opacity-0" : "opacity-100"}`}
                            />
                            
                            {/* === FLASH TOGGLE (top-right in camera view) === */}
                            {!isCameraLoading && scanPhase !== 'preview' && scanPhase !== 'adjusting' && (
                                <button
                                    onClick={toggleFlash}
                                    className={`absolute top-3 right-3 z-25 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                                        isFlashOn 
                                            ? 'bg-yellow-500/30 border-yellow-500/50 text-yellow-300' 
                                            : 'bg-black/30 border-white/20 text-white/60'
                                    }`}
                                >
                                    <span className="material-symbols-outlined !text-[20px]">
                                        {isFlashOn ? 'flash_on' : 'flash_off'}
                                    </span>
                                </button>
                            )}

                            {/* === DOCUMENT SCANNER OVERLAY === */}
                            {!isCameraLoading && scanPhase !== 'preview' && scanPhase !== 'adjusting' && (
                                <div className="absolute inset-0 pointer-events-none z-20">
                                    
                                    {/* SVG Polygon connecting detected corners */}
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <polygon
                                            points={`${uiCorners[0].x * 100},${uiCorners[0].y * 100} ${uiCorners[1].x * 100},${uiCorners[1].y * 100} ${uiCorners[3].x * 100},${uiCorners[3].y * 100} ${uiCorners[2].x * 100},${uiCorners[2].y * 100}`}
                                            fill={scanPhase === 'ready' || scanPhase === 'capturing' ? "rgba(34,197,94,0.08)" : "transparent"}
                                            stroke={
                                                scanPhase === 'ready' || scanPhase === 'capturing' ? "#22c55e" :
                                                scanPhase === 'tracking' ? "#eab308" : "rgba(255,255,255,0.35)"
                                            }
                                            strokeWidth={scanPhase === 'ready' ? "0.8" : "0.4"}
                                            strokeDasharray={scanPhase === 'searching' ? "2 1.5" : "none"}
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </svg>

                                    {/* 4 Corner L-shaped markers */}
                                    {([
                                        { corner: uiCorners[0], rot: "0deg",   idx: 0 },
                                        { corner: uiCorners[1], rot: "90deg",  idx: 1 },
                                        { corner: uiCorners[2], rot: "270deg", idx: 2 },
                                        { corner: uiCorners[3], rot: "180deg", idx: 3 },
                                    ] as const).map(({ corner, rot, idx }) => {
                                        const isReady = scanPhase === 'ready' || scanPhase === 'capturing';
                                        const isTracking = scanPhase === 'tracking';
                                        const cornerColor = isReady ? "bg-green-500 shadow-[0_0_16px_rgba(34,197,94,0.9)]" :
                                            isTracking ? "bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.6)]" : "bg-white/50";
                                        return (
                                            <div
                                                key={idx}
                                                className={`absolute w-10 h-10 transition-all duration-150 ease-out ${isReady ? "opacity-100" : isTracking ? "opacity-90" : "opacity-60"}`}
                                                style={{
                                                    left: `calc(${corner.x * 100}% - 20px)`,
                                                    top:  `calc(${corner.y * 100}% - 20px)`,
                                                    transform: `rotate(${rot})`
                                                } as React.CSSProperties}
                                            >
                                                <div className={`absolute top-0 left-0 w-full h-1.5 rounded-full transition-colors duration-300 ${cornerColor}`}></div>
                                                <div className={`absolute top-0 left-0 w-1.5 h-full rounded-full transition-colors duration-300 ${cornerColor}`}></div>
                                                {scanPhase === 'searching' && (
                                                    <div className="absolute top-0 left-0 w-3 h-3 bg-white/30 rounded-full animate-ping"></div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Status indicator */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                                        <div className={`px-4 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border transition-all duration-500 ${
                                            scanPhase === 'ready' || scanPhase === 'capturing'
                                                ? "bg-green-500/30 text-white border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                                                : scanPhase === 'tracking'
                                                    ? "bg-yellow-500/20 text-white border-yellow-500/30"
                                                    : "bg-white/5 text-white/40 border-white/10"
                                        }`}>
                                            {captureCountdown !== null
                                                ? `📸 التصوير بعد ${captureCountdown}...`
                                                : scanPhase === 'ready' || scanPhase === 'capturing'
                                                    ? "✓ المستند جاهز للمسح"
                                                    : scanPhase === 'tracking'
                                                        ? "⬡ جاري تتبع حواف المستند..."
                                                        : "◎ وجه الكاميرا نحو المستند"}
                                        </div>
                                    </div>

                                    {/* Countdown overlay */}
                                    {captureCountdown !== null && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-black/60 backdrop-blur-md rounded-3xl px-12 py-6 flex flex-col items-center gap-2 border border-green-500/50">
                                                <span className="text-green-400 text-7xl font-black leading-none">{captureCountdown}</span>
                                                <span className="text-white text-xs font-bold tracking-widest uppercase">Auto Capture</span>
                                                <span className="text-white/50 text-[10px]">لا تتحرك</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* === MANUAL CORNER ADJUSTMENT PHASE === */}
                            {scanPhase === 'adjusting' && rawFrame && (
                                <div className="absolute inset-0 z-30 bg-black flex flex-col"
                                    onPointerMove={handleCornerPointerMove}
                                    onPointerUp={handleCornerPointerUp}
                                >
                                    {/* Header */}
                                    <div className="p-3 flex items-center justify-center">
                                        <div className="px-4 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md bg-blue-500/20 text-white border border-blue-500/30">
                                            ✋ اسحب الزوايا لتحديد حدود المستند بدقة
                                        </div>
                                    </div>
                                    
                                    {/* Image with draggable corners - corners are relative to img */}
                                    <div className="flex-1 flex items-center justify-center px-4">
                                        <div className="relative inline-block">
                                            <img 
                                                ref={adjustImageRef}
                                                src={rawFrame} 
                                                alt="الصورة الملتقطة" 
                                                className="block max-w-full max-h-[65vh] rounded-lg touch-none"
                                                draggable={false}
                                            />
                                            
                                            {/* SVG overlay - exactly covers the image */}
                                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <polygon
                                                    points={`${adjustCorners[0].x * 100},${adjustCorners[0].y * 100} ${adjustCorners[1].x * 100},${adjustCorners[1].y * 100} ${adjustCorners[3].x * 100},${adjustCorners[3].y * 100} ${adjustCorners[2].x * 100},${adjustCorners[2].y * 100}`}
                                                    fill="rgba(59,130,246,0.10)"
                                                    stroke="#3b82f6"
                                                    strokeWidth="0.6"
                                                    vectorEffect="non-scaling-stroke"
                                                />
                                                {/* Lines from each corner */}
                                                {[0,1,2,3].map(i => {
                                                    const next = i < 2 ? (i === 0 ? 1 : 3) : (i === 2 ? 0 : 2);
                                                    return <line key={`l${i}`}
                                                        x1={adjustCorners[i].x*100} y1={adjustCorners[i].y*100}
                                                        x2={adjustCorners[next].x*100} y2={adjustCorners[next].y*100}
                                                        stroke="#3b82f6" strokeWidth="0.3" strokeDasharray="1 1"
                                                        vectorEffect="non-scaling-stroke" opacity="0.4"
                                                    />;
                                                })}
                                            </svg>
                                            
                                            {/* 4 Draggable corner dots - positioned relative to this wrapper = image */}
                                            {adjustCorners.map((corner, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`absolute cursor-grab active:cursor-grabbing z-40 touch-none flex items-center justify-center w-9 h-9 -ml-[18px] -mt-[18px] ${
                                                        draggingCorner === idx ? 'scale-150' : 'scale-100'
                                                    } transition-transform`}
                                                    style={{
                                                        left: `${corner.x * 100}%`,
                                                        top: `${corner.y * 100}%`,
                                                    } as React.CSSProperties}
                                                    onPointerDown={(e) => handleCornerPointerDown(idx, e)}
                                                >
                                                    {/* Inner dot */}
                                                    <div className={`w-6 h-6 rounded-full border-[3px] border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] ${
                                                        draggingCorner === idx ? 'bg-blue-500' : 'bg-blue-500/80'
                                                    }`}></div>
                                                    {/* Outer pulse ring */}
                                                    <div className="absolute w-9 h-9 rounded-full border-2 border-blue-400/40 animate-pulse"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Action buttons */}
                                    <div className="p-6 flex flex-col items-center gap-3">
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={retakePhoto}
                                                className="px-5 py-3 bg-white/10 text-white rounded-xl border border-white/20 font-bold text-sm hover:bg-white/20 transition-all"
                                            >
                                                ↩ إعادة التصوير
                                            </button>
                                            <button 
                                                onClick={cropFromRawFrame}
                                                className="px-5 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all shadow-lg flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined !text-[18px]">crop</span>
                                                تأكيد القص
                                            </button>
                                        </div>
                                        <p className="text-white/40 text-[10px]">اسحب الدوائر الزرقاء إلى زوايا المستند</p>
                                    </div>
                                </div>
                            )}

                            {/* === CAPTURED IMAGE PREVIEW WITH ENHANCEMENT TOOLBAR === */}
                            {scanPhase === 'preview' && capturedImage && (
                                <div className="absolute inset-0 z-30 bg-black flex flex-col">
                                    {/* Processing overlay */}
                                    {isProcessing && (
                                        <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <p className="text-white/80 text-xs font-bold">جارٍ المعالجة...</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Image preview */}
                                    <div className="flex-1 flex items-center justify-center p-4">
                                        <img 
                                            src={capturedImage} 
                                            alt="المستند الملتقط" 
                                            className="max-w-full max-h-[55vh] object-contain rounded-lg border-2 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]"
                                        />
                                    </div>
                                    
                                    {/* === ENHANCEMENT TOOLBAR === */}
                                    <div className="px-4 py-3 flex justify-center gap-2 flex-wrap">
                                        {/* Rotate */}
                                        <button 
                                            onClick={rotateImage90}
                                            disabled={isProcessing}
                                            className="flex flex-col items-center gap-1 px-3 py-2 bg-white/10 text-white rounded-xl border border-white/10 hover:bg-white/20 transition-all disabled:opacity-40"
                                        >
                                            <span className="material-symbols-outlined !text-[20px]">rotate_right</span>
                                            <span className="text-[10px]">تدوير</span>
                                        </button>
                                        
                                        {/* Remove Shadows */}
                                        <button 
                                            onClick={removeShadows}
                                            disabled={isProcessing}
                                            className="flex flex-col items-center gap-1 px-3 py-2 bg-white/10 text-white rounded-xl border border-white/10 hover:bg-white/20 transition-all disabled:opacity-40"
                                        >
                                            <span className="material-symbols-outlined !text-[20px]">brightness_6</span>
                                            <span className="text-[10px]">إزالة الظل</span>
                                        </button>
                                        
                                        {/* Remove Glare */}
                                        <button 
                                            onClick={removeGlare}
                                            disabled={isProcessing}
                                            className="flex flex-col items-center gap-1 px-3 py-2 bg-white/10 text-white rounded-xl border border-white/10 hover:bg-white/20 transition-all disabled:opacity-40"
                                        >
                                            <span className="material-symbols-outlined !text-[20px]">flare</span>
                                            <span className="text-[10px]">إزالة الوهج</span>
                                        </button>
                                    </div>
                                    
                                    {/* === ACTION BUTTONS === */}
                                    <div className="px-4 pb-6 flex flex-col items-center gap-3">
                                        {!showExportDialog ? (
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={retakePhoto}
                                                    className="px-5 py-3 bg-white/10 text-white rounded-xl border border-white/20 font-bold text-sm hover:bg-white/20 transition-all"
                                                >
                                                    ↩ إعادة التصوير
                                                </button>
                                                <button 
                                                    onClick={() => setShowExportDialog(true)}
                                                    disabled={isProcessing}
                                                    className="px-5 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all shadow-lg disabled:opacity-50"
                                                >
                                                    ✓ حفظ المستند
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3">
                                                <p className="text-white/60 text-xs font-bold">اختر صيغة التصدير:</p>
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={() => saveDocument('image')}
                                                        className="px-5 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined !text-[18px]">image</span>
                                                        صورة (PNG)
                                                    </button>
                                                    <button 
                                                        onClick={() => saveDocument('pdf')}
                                                        className="px-5 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined !text-[18px]">picture_as_pdf</span>
                                                        PDF
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => setShowExportDialog(false)}
                                                    className="text-white/40 text-xs underline"
                                                >
                                                    رجوع
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer Controls */}
                        <div className="p-10 flex flex-col items-center gap-6 bg-black z-10">
                            <p className="text-white/60 text-xs text-center max-w-[240px]">
                                {scanPhase === 'adjusting'
                                    ? "حرّك الزوايا لتحديد حدود المستند ثم اضغط تأكيد القص"
                                    : scanPhase === 'preview' 
                                        ? "راجع المستند الملتقط واختر حفظه أو إعادة التصوير"
                                        : captureCountdown !== null 
                                            ? "ابقى ثابتاً، جارٍ الالتقاط تلقائياً..." 
                                            : scanPhase === 'ready'
                                                ? "✓ المستند جاهز، الالتقاط التلقائي قريباً" 
                                                : "ضع المستند داخل الإطار وتأكد من وضوح كافة الزوايا"}
                            </p>
                            {scanPhase !== 'preview' && scanPhase !== 'adjusting' && (
                                <button 
                                    onClick={takePhoto}
                                    disabled={isCameraLoading}
                                    title="التقاط صورة"
                                    aria-label="التقاط صورة"
                                    className={`size-20 rounded-full border-4 flex items-center justify-center group active:scale-95 transition-all duration-300 
                                        ${isCameraLoading ? "border-white/20 cursor-not-allowed opacity-50" : 
                                          scanPhase === 'ready' ? "border-green-500 scale-110" : 
                                          scanPhase === 'tracking' ? "border-yellow-400" : "border-white"}`}
                                >
                                    <div className={`size-16 rounded-full transition-all shadow-xl 
                                        ${isCameraLoading ? "bg-white/10" : 
                                          scanPhase === 'ready' ? "bg-green-500" : 
                                          scanPhase === 'tracking' ? "bg-yellow-400 group-hover:bg-yellow-300" : "bg-white group-hover:bg-white/80"}`}></div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Canvas for Processing */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto">
                <button
                    onClick={handleNext}
                    disabled={!isFormValid || isSubmittingContext}
                    className={`w-full flex items-center justify-center gap-2 text-white font-bold text-base py-4 rounded-xl shadow-lg transition-all duration-200 ${isFormValid && !isSubmittingContext
                        ? "bg-primary hover:bg-primary/90 shadow-primary/25"
                        : "bg-slate-700 cursor-not-allowed opacity-50"
                        }`}
                >
                    {isSubmittingContext ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            جاري الحفظ...
                        </>
                    ) : (
                        <>
                            <span>التالي: رخصة العمل</span>
                            <span className="material-symbols-outlined !text-[20px] rtl:-scale-x-100">
                                arrow_right_alt
                            </span>
                        </>
                    )}
                </button>
            </div>
        </>
    );
}

export default function IdentityVerificationPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-bg-dark font-display items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">جاري التحميل...</p>
            </div>
        }>
            <IdentityVerificationContent />
        </Suspense>
    );
}
