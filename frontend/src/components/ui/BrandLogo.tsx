import { BookOutlined } from '@ant-design/icons';

const sizes = {
  sm: 'h-9 w-9 text-base',
  md: 'h-10 w-10 text-lg',
} as const;

interface BrandLogoProps {
  size?: keyof typeof sizes;
}

const BrandLogo = ({ size = 'md' }: BrandLogoProps) => (
  <div
    className={`flex items-center justify-center rounded-lg bg-indigo-600 text-white ${sizes[size]}`}
  >
    <BookOutlined />
  </div>
);

export default BrandLogo;
