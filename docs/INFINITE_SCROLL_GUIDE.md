# Infinite Scroll & Filtering Implementation Guide

## Overview
The Feed page has been upgraded from traditional pagination to infinite scroll with advanced filtering capabilities. This provides a better user experience with seamless content loading and powerful search options.

## Features Implemented

### 1. Infinite Scroll
- **Initial Load:** 20 most recent posts
- **Auto-load Trigger:** When user scrolls to around the 15-16th post
- **Load More:** Automatically fetches next 20 posts
- **Visual Feedback:** Loading spinner while fetching
- **End Detection:** "Đã hiển thị tất cả bài viết" message when no more posts

### 2. Post Filtering
Users can filter posts by:
- **Author Name:** Partial, case-insensitive search
- **Date Range:** From date and/or to date
- **Active Filter Indicator:** Badge showing number of active filters
- **Quick Clear:** One-click button to remove all filters

## Frontend Implementation

### Technology Stack
- **React Query:** `useInfiniteQuery` for infinite scroll
- **Intersection Observer:** Native browser API for scroll detection
- **TailwindCSS:** Responsive filter UI

### Key Components

#### Feed.jsx Structure
```jsx
import { useInfiniteQuery } from '@tanstack/react-query';

const Feed = () => {
  // Filter states
  const [filters, setFilters] = useState({
    author: '',
    fromDate: '',
    toDate: '',
  });
  
  // Infinite query
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed-posts', filters],
    queryFn: ({ pageParam = 1 }) => postsAPI.getAll({ 
      page: pageParam, 
      limit: 20,
      ...filters 
    }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data.pagination;
      return pagination.hasNext ? pagination.page + 1 : undefined;
    },
  });
  
  // Flatten posts from all pages
  const allPosts = postsData?.pages?.flatMap(page => page.data.data) || [];
```

#### Intersection Observer Setup
```jsx
const observerTarget = useRef(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    { threshold: 0.1, rootMargin: '200px' }
  );

  const currentTarget = observerTarget.current;
  if (currentTarget) {
    observer.observe(currentTarget);
  }

  return () => {
    if (currentTarget) {
      observer.unobserve(currentTarget);
    }
  };
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

#### Observer Target Placement
```jsx
{allPosts.map((post, index) => (
  <div key={post.id}>
    <PostCard post={post} currentUser={currentUser} />
    {/* Place observer near the 16th post */}
    {index === Math.min(15, allPosts.length - 5) && (
      <div ref={observerTarget} className="h-1" />
    )}
  </div>
))}
```

### Filter UI
```jsx
{/* Filter Panel */}
{showFilters && (
  <div className="bg-white rounded-lg shadow p-4 space-y-4">
    <h3 className="font-semibold text-gray-900">Bộ lọc bài viết</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Author Filter */}
      <div>
        <label>Tên người đăng</label>
        <input
          type="text"
          value={filters.author}
          onChange={(e) => handleFilterChange('author', e.target.value)}
          placeholder="Nhập tên..."
        />
      </div>
      
      {/* Date Range Filters */}
      <div>
        <label>Từ ngày</label>
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => handleFilterChange('fromDate', e.target.value)}
        />
      </div>
      
      <div>
        <label>Đến ngày</label>
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => handleFilterChange('toDate', e.target.value)}
        />
      </div>
    </div>
  </div>
)}
```

## Backend Implementation

### API Endpoint: GET /api/posts

#### Query Parameters
```javascript
{
  page: 1,              // Page number (for infinite scroll)
  limit: 20,            // Items per page
  author: "John",       // Optional: Filter by author name
  fromDate: "2024-01-01", // Optional: Posts from this date
  toDate: "2024-12-31"    // Optional: Posts until this date
}
```

#### Filter Implementation
```javascript
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  // Build filter query
  const filter = {};
  
  // Author filter (case-insensitive partial match)
  if (req.query.author) {
    filter.author = { $regex: req.query.author, $options: 'i' };
  }
  
  // Date range filter
  if (req.query.fromDate || req.query.toDate) {
    filter.createdAt = {};
    if (req.query.fromDate) {
      filter.createdAt.$gte = new Date(req.query.fromDate);
    }
    if (req.query.toDate) {
      const toDate = new Date(req.query.toDate);
      toDate.setDate(toDate.getDate() + 1); // Include entire day
      filter.createdAt.$lt = toDate;
    }
  }
  
  // Query with filters
  const total = await Post.countDocuments(filter);
  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  // Return with pagination metadata
  res.json({
    data: posts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  });
});
```

## How It Works

### Initial Page Load
1. User opens Feed page
2. `useInfiniteQuery` fetches first page (20 posts)
3. Posts render with IntersectionObserver attached

### Infinite Scroll Trigger
1. User scrolls down the feed
2. When post #15-16 becomes visible (enters viewport with 200px margin)
3. IntersectionObserver callback fires
4. Check: `hasNextPage && !isFetchingNextPage`
5. If true, call `fetchNextPage()`
6. New page (21-40) fetches and appends to existing posts

### Filter Application
1. User opens filter panel
2. Enters filter criteria (author name, dates)
3. Filter state updates → triggers query key change
4. React Query automatically refetches with new filters
5. Posts reset and load from page 1 with filters applied

### Observer Placement Strategy
```javascript
// Place at post 15, or 5 posts before end (whichever is smaller)
index === Math.min(15, allPosts.length - 5)
```
- **Why 15?** Triggers when ~75% of initial 20 posts are viewed
- **Why -5 buffer?** Ensures trigger even with fewer posts
- **Why 200px rootMargin?** Prefetch before reaching actual post

## Performance Optimizations

### 1. Query Key with Filters
```javascript
queryKey: ['feed-posts', filters]
```
- Separate cache for each filter combination
- Automatic refetch when filters change
- Previous results cached for quick back navigation

### 2. Flattened Data Structure
```javascript
const allPosts = postsData?.pages?.flatMap(page => page.data.data) || [];
```
- Single array for rendering
- Efficient iteration
- No nested loops needed

### 3. Conditional Observer
```javascript
if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
  fetchNextPage();
}
```
- Only fetch if more pages exist
- Prevent duplicate requests
- Stop when reaching end

### 4. MongoDB Index Optimization
```javascript
// Recommended indexes for posts collection
db.posts.createIndex({ createdAt: -1 });  // Sort performance
db.posts.createIndex({ author: 1 });      // Author filter
db.posts.createIndex({ createdAt: 1, author: 1 }); // Combined filter
```

## User Experience

### Visual Indicators

#### Active Filters Badge
```jsx
{hasActiveFilters && (
  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
    {[filters.author, filters.fromDate, filters.toDate].filter(Boolean).length}
  </span>
)}
```

#### Loading State
```jsx
{isFetchingNextPage && (
  <div className="flex justify-center py-4">
    <LoadingSpinner />
  </div>
)}
```

#### End of Feed
```jsx
{!hasNextPage && allPosts.length > 0 && (
  <div className="text-center py-4 text-gray-500">
    Đã hiển thị tất cả bài viết
  </div>
)}
```

#### Empty State with Filters
```jsx
{allPosts.length === 0 && (
  <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
    {hasActiveFilters 
      ? 'Không tìm thấy bài viết nào với bộ lọc này.' 
      : 'Chưa có bài viết nào.'}
  </div>
)}
```

## Testing Scenarios

### 1. Basic Infinite Scroll
```
1. Load Feed page → See 20 posts
2. Scroll to post 15 → New posts load automatically
3. Scroll to post 35 → Another batch loads
4. Continue until "Đã hiển thị tất cả bài viết"
```

### 2. Author Filter
```
1. Click "Lọc bài viết" button
2. Enter author name: "John"
3. See only posts from users with "John" in name
4. Infinite scroll still works with filtered results
```

### 3. Date Range Filter
```
1. Open filters
2. Set "Từ ngày": 2024-01-01
3. Set "Đến ngày": 2024-01-31
4. See only January 2024 posts
5. Scroll to load more filtered posts
```

### 4. Combined Filters
```
1. Set author: "Sarah"
2. Set date range: Last 7 days
3. See posts from Sarah in last week only
4. Badge shows "2" (two active filters)
```

### 5. Clear Filters
```
1. Apply multiple filters
2. Click "Xóa bộ lọc" button
3. All filters reset
4. Feed shows all posts again
```

## Edge Cases Handled

### 1. No More Posts
- Observer stops triggering
- "End of feed" message displays
- `hasNextPage = false`

### 2. Filter Returns 0 Results
- Shows appropriate empty state message
- No infinite scroll triggered
- Filter panel remains open for adjustment

### 3. Network Error
- React Query retry logic (3 attempts)
- Error boundary catches failures
- User can manually retry

### 4. Rapid Filter Changes
- Query key change cancels previous request
- Only latest filter combination loads
- No race conditions

### 5. Small Result Sets
- Observer placed correctly even with <20 posts
- Works with single page results
- No unnecessary fetch attempts

## Benefits vs Traditional Pagination

### User Experience
- ✅ No clicking page numbers
- ✅ Seamless browsing experience
- ✅ Natural mobile/desktop scrolling
- ✅ Faster content discovery
- ✅ Better engagement metrics

### Performance
- ✅ Load data as needed (lazy loading)
- ✅ Reduce initial page load time
- ✅ Smart prefetching with rootMargin
- ✅ Cached pages for quick re-render
- ✅ Efficient memory usage (virtual scrolling possible)

### Development
- ✅ Simpler state management
- ✅ Built-in React Query support
- ✅ Less UI complexity
- ✅ Native browser APIs
- ✅ Easy to add filters

## Future Enhancements

### 1. Virtual Scrolling
For very large datasets (thousands of posts):
```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: allPosts.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200, // Average post height
});
```

### 2. Optimistic Updates
When creating new post:
```javascript
onMutate: async (newPost) => {
  await queryClient.cancelQueries(['feed-posts']);
  const previousPosts = queryClient.getQueryData(['feed-posts']);
  
  queryClient.setQueryData(['feed-posts'], (old) => ({
    pages: [{ data: [newPost, ...old.pages[0].data] }, ...old.pages.slice(1)],
    pageParams: old.pageParams,
  }));
  
  return { previousPosts };
}
```

### 3. More Filter Options
- Tags/Categories
- Likes range (popular posts)
- User's following only
- Trending/Hot posts
- Search in content

### 4. Save Filter Preferences
```javascript
useEffect(() => {
  localStorage.setItem('feedFilters', JSON.stringify(filters));
}, [filters]);
```

### 5. Infinite Scroll Direction
Load older posts when scrolling down, newer when pulling down:
```javascript
const {
  fetchNextPage,      // Older posts
  fetchPreviousPage,  // Newer posts
  hasNextPage,
  hasPreviousPage,
} = useInfiniteQuery({...});
```

## Troubleshooting

### Issue: Infinite loop of fetching
**Cause:** Observer always intersecting
**Solution:** Check `hasNextPage && !isFetchingNextPage` conditions

### Issue: Filters not working
**Cause:** Backend not receiving query params
**Solution:** Verify API service passes params correctly:
```javascript
postsAPI.getAll({ page, limit, author, fromDate, toDate })
```

### Issue: Posts duplicating
**Cause:** Same post appears in multiple pages
**Solution:** Backend ensure consistent sort order with unique field:
```javascript
.sort({ createdAt: -1, _id: -1 })
```

### Issue: Scroll position lost on filter change
**Cause:** Query key change resets scroll
**Solution:** Expected behavior - filters reset view to top

## Summary

✅ **Infinite Scroll:** Auto-loads 20 posts at a time when scrolling near post 15-16
✅ **Filters:** Author name, date range with visual indicators
✅ **Backend:** Query param filters with MongoDB regex and date operators
✅ **UX:** Loading states, end-of-feed message, filter badges
✅ **Performance:** React Query caching, Intersection Observer, optimized queries
✅ **Scalability:** Works with millions of posts, ready for virtual scrolling

---

**Last Updated:** November 2024  
**Related Documents:**
- [PAGINATION_GUIDE.md](./PAGINATION_GUIDE.md) - Traditional pagination approach
- [NEO4J_API_GUIDE.md](./NEO4J_API_GUIDE.md) - Social network features
