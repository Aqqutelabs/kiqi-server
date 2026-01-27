export interface DashboardMetrics {
    total_press_releases: number;
    total_views: string;  // e.g., "5.2K"
    total_spent: string;  // Currency formatted string
    total_channels: number;
}

export interface PressReleaseListItem {
    title: string;
    status: 'Published' | 'Draft' | 'Scheduled';
    distribution: string;
    campaign: string;
    performance_views: string;
    date_created: string;
}

export interface PressReleaseMetrics {
    total_views: number;
    total_clicks: number;
    engagement_rate: string;  // Percentage
    avg_time_on_page: string;  // Time format
}

export interface DistributionReportItem {
    outlet_name: string;
    outlet_status: 'Published' | 'Pending';
    outlet_clicks: number;
    outlet_views: string;  // e.g., "5.2K"
    publication_link: string;
    publication_date: string;
}

export interface PublisherPlatform {
    id: string;
    name: string;
    price: string;  // Currency formatted
    avg_publish_time: string;
    industry_focus: string[];
    region_reach: string[];
    audience_reach: string;
    key_features: string[];
    metrics: {
        domain_authority: number;
        trust_score: number;
        avg_traffic: number;
        social_signals: number;
    };
}

export interface CheckoutPublicationItem {
    name: string;
    price: string;  // Currency formatted
    details: string;
}

export interface OrderSummary {
    subtotal: string;
    vat_percentage: string;
    vat_amount: string;
    total_amount: string;
}

export interface PaymentMethod {
    name: string;
    status: 'Available' | 'Coming soon';
}

export interface CheckoutOrder {
    publications: CheckoutPublicationItem[];
    order_summary: OrderSummary;
    payment_methods: PaymentMethod[];
}

export interface CreatePressRelease {
    pr_content: string;  // Rich text content
    status: 'Draft' | 'Published' | 'Scheduled';
    image?: string; // Optional image field
}

// Press Release Tracker Status Types
export type PressReleaseTrackerStatus = 'completed' | 'pending' | 'processing' | 'review' | 'rejected';

export interface StatusConfig {
    icon: string; // icon name for frontend
    color: string;
    textColor: string;
}

export interface StatusConfigMap {
    [key: string]: StatusConfig;
}

export interface PressReleaseTracker {
    _id: string;
    pr_id: string;
    title: string;
    current_status: PressReleaseTrackerStatus;
    status_history: Array<{
        status: PressReleaseTrackerStatus;
        timestamp: string;
        notes?: string;
    }>;
    progress_percentage: number;
    estimated_completion: string;
    actual_completion?: string;
    reviewers_count: number;
    distribution_outlets: number;
    current_step: number;
    total_steps: number;
}

export interface ProgressTrackerResponse {
    tracker: PressReleaseTracker;
    status_config: StatusConfigMap;
    timeline: Array<{
        status: PressReleaseTrackerStatus;
        date: string;
        description: string;
    }>;
}

// Review System Types
export interface Review {
    _id: string;
    press_release_id: string;
    user_id?: string;
    reviewer_name?: string;
    rating: number;
    review_text: string;
    status: 'pending' | 'verified' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface ReviewSummary {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

export interface ReviewsListResponse {
    reviews: Review[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalReviews: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface CreateReviewRequest {
    rating: number;
    reviewText: string;
    reviewerName?: string;
}

export interface UpdateReviewRequest {
    rating?: number;
    reviewText?: string;
    reviewerName?: string;
    status?: 'pending' | 'verified' | 'rejected';
}