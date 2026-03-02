/**
 * Professional Document Scanner - Computer Vision Module v2
 * 
 * Approach: Brightness Segmentation → Morphological Cleanup →
 *           Contour Marching → Convex Hull → Quadrilateral Approximation
 * 
 * This approach works because documents are bright regions on a darker background.
 * Unlike edge/line-fitting, it is robust against textured backgrounds.
 */

export interface Point {
    x: number;
    y: number;
}

export interface DetectionResult {
    corners: [Point, Point, Point, Point]; // TL, TR, BL, BR
    area: number;       // as fraction of frame area (0..1)
    isValid: boolean;
}

// =================== IMAGE PROCESSING ===================

/** Convert RGBA to grayscale */
function toGrayscale(data: Uint8ClampedArray, W: number, H: number): Uint8Array {
    const gray = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
        const idx = i * 4;
        gray[i] = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
    }
    return gray;
}

/** 5×5 box blur for stronger noise reduction */
function boxBlur(src: Uint8Array, W: number, H: number): Uint8Array {
    const out = new Uint8Array(W * H);
    const r = 2; // radius
    for (let y = r; y < H - r; y++) {
        for (let x = r; x < W - r; x++) {
            let sum = 0;
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    sum += src[(y + dy) * W + (x + dx)];
                }
            }
            out[y * W + x] = (sum / 25) | 0;
        }
    }
    return out;
}

/** Compute Otsu threshold */
function otsuThreshold(gray: Uint8Array): number {
    const hist = new Uint32Array(256);
    for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

    const total = gray.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];

    let sumB = 0, wB = 0, maxVar = 0, threshold = 128;
    for (let t = 0; t < 256; t++) {
        wB += hist[t];
        if (wB === 0) continue;
        const wF = total - wB;
        if (wF === 0) break;
        sumB += t * hist[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        const v = wB * wF * (mB - mF) * (mB - mF);
        if (v > maxVar) { maxVar = v; threshold = t; }
    }
    return threshold;
}

/** Create binary mask: 1 = bright (document), 0 = dark (background) */
function toBinaryMask(gray: Uint8Array, W: number, H: number): Uint8Array {
    const threshold = otsuThreshold(gray);
    // Use a slightly higher threshold to avoid picking up semi-bright areas
    const t = Math.max(threshold, 80);
    const mask = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
        mask[i] = gray[i] > t ? 1 : 0;
    }
    return mask;
}

/** Morphological erosion (3×3) - removes thin noise */
function erode(mask: Uint8Array, W: number, H: number): Uint8Array {
    const out = new Uint8Array(W * H);
    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            // All 4-connected neighbors must be 1
            if (mask[y * W + x] &&
                mask[(y - 1) * W + x] &&
                mask[(y + 1) * W + x] &&
                mask[y * W + x - 1] &&
                mask[y * W + x + 1]) {
                out[y * W + x] = 1;
            }
        }
    }
    return out;
}

/** Morphological dilation (3×3) - fills small holes */
function dilate(mask: Uint8Array, W: number, H: number): Uint8Array {
    const out = new Uint8Array(W * H);
    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            if (mask[y * W + x] ||
                mask[(y - 1) * W + x] ||
                mask[(y + 1) * W + x] ||
                mask[y * W + x - 1] ||
                mask[y * W + x + 1]) {
                out[y * W + x] = 1;
            }
        }
    }
    return out;
}

/** Morphological open (erode then dilate) - removes noise while preserving shape */
function morphOpen(mask: Uint8Array, W: number, H: number): Uint8Array {
    return dilate(erode(mask, W, H), W, H);
}

/** Morphological close (dilate then erode) - fills small holes */
function morphClose(mask: Uint8Array, W: number, H: number): Uint8Array {
    return erode(dilate(mask, W, H), W, H);
}

// =================== CONTOUR EXTRACTION ===================

/** 
 * Find the largest connected bright region using flood fill.
 * Returns a mask with only the largest region.
 */
function largestRegion(mask: Uint8Array, W: number, H: number): Uint8Array {
    const labels = new Int32Array(W * H);
    let currentLabel = 0;
    const regionSizes: Map<number, number> = new Map();

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = y * W + x;
            if (mask[i] === 1 && labels[i] === 0) {
                currentLabel++;
                let size = 0;
                // BFS flood fill
                const queue: number[] = [i];
                labels[i] = currentLabel;
                while (queue.length > 0) {
                    const idx = queue.pop()!;
                    size++;
                    const px = idx % W;
                    const py = (idx / W) | 0;
                    // 4-connected neighbors
                    for (const [nx, ny] of [[px-1,py],[px+1,py],[px,py-1],[px,py+1]]) {
                        if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                            const ni = ny * W + nx;
                            if (mask[ni] === 1 && labels[ni] === 0) {
                                labels[ni] = currentLabel;
                                queue.push(ni);
                            }
                        }
                    }
                }
                regionSizes.set(currentLabel, size);
            }
        }
    }

    // Find largest region
    let bestLabel = 0, bestSize = 0;
    for (const [label, size] of regionSizes) {
        if (size > bestSize) { bestSize = size; bestLabel = label; }
    }

    // Create mask of only largest region
    const result = new Uint8Array(W * H);
    if (bestLabel > 0) {
        for (let i = 0; i < W * H; i++) {
            if (labels[i] === bestLabel) result[i] = 1;
        }
    }
    return result;
}

/**
 * Extract boundary points of the bright region by scanning for
 * transitions between 0→1 and 1→0 in rows and columns.
 */
function extractBoundaryPoints(mask: Uint8Array, W: number, H: number): Point[] {
    const boundary: Set<string> = new Set();
    
    // A pixel is on the boundary if it is 1 and has at least one 0 neighbor
    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            const i = y * W + x;
            if (mask[i] === 1) {
                if (mask[i - 1] === 0 || mask[i + 1] === 0 ||
                    mask[i - W] === 0 || mask[i + W] === 0) {
                    boundary.add(`${x},${y}`);
                }
            }
        }
    }

    return Array.from(boundary).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y };
    });
}

// =================== CONVEX HULL ===================

/** Cross product of vectors OA and OB */
function cross(O: Point, A: Point, B: Point): number {
    return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
}

/** Compute convex hull using Andrew's monotone chain algorithm */
function convexHull(points: Point[]): Point[] {
    if (points.length < 3) return points;
    
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    const n = sorted.length;
    
    // Build lower hull
    const lower: Point[] = [];
    for (const p of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }
    
    // Build upper hull
    const upper: Point[] = [];
    for (let i = n - 1; i >= 0; i--) {
        const p = sorted[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
            upper.pop();
        }
        upper.push(p);
    }
    
    // Remove last point of each half because it's repeated
    lower.pop();
    upper.pop();
    
    return lower.concat(upper);
}

// =================== QUADRILATERAL APPROXIMATION ===================

/** Distance from point P to line segment AB */
function pointToSegmentDist(P: Point, A: Point, B: Point): number {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((P.x - A.x) ** 2 + (P.y - A.y) ** 2);
    let t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = A.x + t * dx;
    const projY = A.y + t * dy;
    return Math.sqrt((P.x - projX) ** 2 + (P.y - projY) ** 2);
}

/**
 * Douglas-Peucker polygon simplification.
 * Simplifies a polygon to fewer points while preserving shape.
 */
function simplifyPolygon(points: Point[], epsilon: number): Point[] {
    if (points.length <= 2) return points;
    
    // Find point with maximum distance from line between first and last
    let maxDist = 0;
    let maxIdx = 0;
    const first = points[0];
    const last = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
        const d = pointToSegmentDist(points[i], first, last);
        if (d > maxDist) { maxDist = d; maxIdx = i; }
    }
    
    if (maxDist > epsilon) {
        const left = simplifyPolygon(points.slice(0, maxIdx + 1), epsilon);
        const right = simplifyPolygon(points.slice(maxIdx), epsilon);
        return left.slice(0, -1).concat(right);
    } else {
        return [first, last];
    }
}

/**
 * Find the best 4 points from a convex hull that approximate a quadrilateral.
 * Uses the "farthest point from diagonal" method.
 */
function findBestQuadrilateral(hull: Point[]): Point[] | null {
    if (hull.length < 4) return null;
    
    // Try simplification at different epsilon levels
    for (let eps = 2; eps <= 30; eps += 2) {
        const simplified = simplifyPolygon([...hull, hull[0]], eps);
        // Remove the duplicate closing point
        const poly = simplified.slice(0, -1);
        if (poly.length === 4) return poly;
        if (poly.length < 4) break; // Too simplified
    }
    
    // Fallback: pick 4 extreme points (topmost, rightmost, bottommost, leftmost)
    if (hull.length >= 4) {
        let topIdx = 0, rightIdx = 0, bottomIdx = 0, leftIdx = 0;
        for (let i = 1; i < hull.length; i++) {
            if (hull[i].y < hull[topIdx].y) topIdx = i;
            if (hull[i].x > hull[rightIdx].x) rightIdx = i;
            if (hull[i].y > hull[bottomIdx].y) bottomIdx = i;
            if (hull[i].x < hull[leftIdx].x) leftIdx = i;
        }
        // Ensure 4 unique points
        const indices = new Set([topIdx, rightIdx, bottomIdx, leftIdx]);
        if (indices.size === 4) {
            return [hull[topIdx], hull[rightIdx], hull[bottomIdx], hull[leftIdx]];
        }
    }
    
    return null;
}

// =================== CORNER ORDERING & VALIDATION ===================

/** Order 4 points as TL, TR, BL, BR */
function orderCorners(pts: Point[]): [Point, Point, Point, Point] {
    // Find center
    const cx = pts.reduce((s, p) => s + p.x, 0) / 4;
    const cy = pts.reduce((s, p) => s + p.y, 0) / 4;
    
    // Classify by quadrant relative to center
    const topLeft = pts.filter(p => p.x <= cx && p.y <= cy);
    const topRight = pts.filter(p => p.x > cx && p.y <= cy);
    const bottomLeft = pts.filter(p => p.x <= cx && p.y > cy);
    const bottomRight = pts.filter(p => p.x > cx && p.y > cy);
    
    // If any quadrant is empty, fall back to sorting
    if (!topLeft.length || !topRight.length || !bottomLeft.length || !bottomRight.length) {
        const sorted = [...pts].sort((a, b) => a.y - b.y);
        const topPair = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
        const bottomPair = sorted.slice(2, 4).sort((a, b) => a.x - b.x);
        return [topPair[0], topPair[1], bottomPair[0], bottomPair[1]];
    }
    
    return [topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]];
}

/** Calculate quadrilateral area using Shoelace formula */
function quadArea(tl: Point, tr: Point, bl: Point, br: Point): number {
    // Order: TL → TR → BR → BL (clockwise)
    return 0.5 * Math.abs(
        (tl.x * tr.y - tr.x * tl.y) +
        (tr.x * br.y - br.x * tr.y) +
        (br.x * bl.y - bl.x * br.y) +
        (bl.x * tl.y - tl.x * bl.y)
    );
}

/** Angle at vertex B in triangle ABC (degrees) */
function angleDeg(A: Point, B: Point, C: Point): number {
    const ba = { x: A.x - B.x, y: A.y - B.y };
    const bc = { x: C.x - B.x, y: C.y - B.y };
    const dot = ba.x * bc.x + ba.y * bc.y;
    const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
    const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
    if (magBA < 0.001 || magBC < 0.001) return 0;
    return Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC)))) * (180 / Math.PI);
}

/** Validate quadrilateral */
function validateQuad(corners: [Point, Point, Point, Point], W: number, H: number): boolean {
    const [tl, tr, bl, br] = corners;
    
    // All corners must be inside frame
    for (const p of corners) {
        if (p.x < 2 || p.x > W - 2 || p.y < 2 || p.y > H - 2) return false;
    }
    
    // Area check: must be 8%–85% of frame
    const area = quadArea(tl, tr, bl, br);
    const frameArea = W * H;
    const ratio = area / frameArea;
    if (ratio < 0.08 || ratio > 0.85) return false;
    
    // Angle check: internal angles should be roughly rectangular (45°–135°)
    const angles = [
        angleDeg(bl, tl, tr),
        angleDeg(tl, tr, br),
        angleDeg(tr, br, bl),
        angleDeg(br, bl, tl)
    ];
    for (const a of angles) {
        if (a < 45 || a > 135) return false;
    }
    
    // Width/height must be reasonable
    const topW = Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2);
    const leftH = Math.sqrt((bl.x - tl.x) ** 2 + (bl.y - tl.y) ** 2);
    if (topW < 20 || leftH < 20) return false;
    
    return true;
}

// =================== MAIN DETECTION ===================

/**
 * Detect a document quadrilateral in a video frame.
 * Pipeline: Grayscale → Blur → Binary Mask → Morphology → 
 *           Largest Region → Boundary → Convex Hull → Quadrilateral
 */
export function detectQuadrilateral(imageData: ImageData, W: number, H: number): DetectionResult | null {
    // Step 1: Grayscale
    const gray = toGrayscale(imageData.data, W, H);
    
    // Step 2: Blur
    const blurred = boxBlur(gray, W, H);
    
    // Step 3: Binary mask
    const binary = toBinaryMask(blurred, W, H);
    
    // Step 4: Morphological cleanup (open to remove noise, close to fill holes)
    const cleaned = morphClose(morphOpen(binary, W, H), W, H);
    
    // Step 5: Find largest bright region
    const region = largestRegion(cleaned, W, H);
    
    // Check region size (must be > 8% of frame)
    let regionPixels = 0;
    for (let i = 0; i < W * H; i++) if (region[i]) regionPixels++;
    if (regionPixels < W * H * 0.08) return null;
    if (regionPixels > W * H * 0.85) return null; // Filling whole frame
    
    // Step 6: Extract boundary points
    const boundary = extractBoundaryPoints(region, W, H);
    if (boundary.length < 20) return null; // Too few boundary points
    
    // Step 7: Convex hull
    const hull = convexHull(boundary);
    if (hull.length < 4) return null;
    
    // Step 8: Find best quadrilateral
    const quad = findBestQuadrilateral(hull);
    if (!quad || quad.length !== 4) return null;
    
    // Step 9: Order corners (TL, TR, BL, BR)
    const ordered = orderCorners(quad);
    
    // Step 10: Validate
    if (!validateQuad(ordered, W, H)) return null;
    
    const area = quadArea(ordered[0], ordered[1], ordered[2], ordered[3]) / (W * H);
    
    return {
        corners: ordered,
        area,
        isValid: true
    };
}

// =================== PERSPECTIVE CROP ===================

/**
 * Crop and warp the document from the video frame using bilinear interpolation.
 */
export function perspectiveCrop(
    video: HTMLVideoElement,
    corners: [Point, Point, Point, Point],
    canvasW: number, canvasH: number,
    outW: number, outH: number
): string {
    const scaleX = video.videoWidth / canvasW;
    const scaleY = video.videoHeight / canvasH;
    const [tl, tr, bl, br] = corners.map(c => ({
        x: c.x * scaleX,
        y: c.y * scaleY
    }));

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = video.videoWidth;
    srcCanvas.height = video.videoHeight;
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCtx.drawImage(video, 0, 0);
    const srcData = srcCtx.getImageData(0, 0, video.videoWidth, video.videoHeight);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    const outCtx = outCanvas.getContext('2d')!;
    const dstData = outCtx.createImageData(outW, outH);

    for (let dy = 0; dy < outH; dy++) {
        const v = dy / (outH - 1);
        for (let dx = 0; dx < outW; dx++) {
            const u = dx / (outW - 1);
            const sx = (1 - u) * (1 - v) * tl.x + u * (1 - v) * tr.x + (1 - u) * v * bl.x + u * v * br.x;
            const sy = (1 - u) * (1 - v) * tl.y + u * (1 - v) * tr.y + (1 - u) * v * bl.y + u * v * br.y;
            const px = Math.round(sx);
            const py = Math.round(sy);
            if (px >= 0 && px < video.videoWidth && py >= 0 && py < video.videoHeight) {
                const si = (py * video.videoWidth + px) * 4;
                const di = (dy * outW + dx) * 4;
                dstData.data[di] = srcData.data[si];
                dstData.data[di + 1] = srcData.data[si + 1];
                dstData.data[di + 2] = srcData.data[si + 2];
                dstData.data[di + 3] = 255;
            }
        }
    }

    outCtx.putImageData(dstData, 0, 0);
    return outCanvas.toDataURL('image/jpeg', 0.95);
}

// =================== UTILITIES ===================

/** Check if corners haven't moved more than maxDrift pixels */
export function areCornersStable(
    prev: [Point, Point, Point, Point],
    curr: [Point, Point, Point, Point],
    maxDrift: number = 5
): boolean {
    for (let i = 0; i < 4; i++) {
        const dx = Math.abs(prev[i].x - curr[i].x);
        const dy = Math.abs(prev[i].y - curr[i].y);
        if (dx > maxDrift || dy > maxDrift) return false;
    }
    return true;
}

/** Smooth corners using lerp */
export function lerpCorners(
    prev: [Point, Point, Point, Point],
    target: [Point, Point, Point, Point],
    factor: number = 0.4
): [Point, Point, Point, Point] {
    return prev.map((p, i) => ({
        x: p.x * (1 - factor) + target[i].x * factor,
        y: p.y * (1 - factor) + target[i].y * factor
    })) as [Point, Point, Point, Point];
}
