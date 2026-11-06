import { Component } from 'react';

// Error boundary: một lỗi ở rạp 3D / trình phát không được làm đen cả trang
// (round 2: chuyển phòng sau vote bỏ qua từng cho ra trang đen hoàn toàn).
// Lỗi chỉ hiện khung báo lỗi tại chỗ, bấm "Thử lại" để gắn lại phần đó.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Rạp gặp lỗi:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-fallback">
          <div>
            <b>Phần này gặp lỗi, không tải được.</b>
            <br />
            <span>Bấm Thử lại để mở lại — ghế và hàng đợi của bạn vẫn còn.</span>
            <br />
            <button className="btn" style={{ marginTop: 10 }} onClick={() => this.setState({ error: null })}>
              Thử lại
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
