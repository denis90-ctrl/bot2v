import tshirtIcon from '../assets/tshirt.png';
import headphonesIcon from '../assets/headphones.png';
import braceletIcon from '../assets/bracelet.png';
import jacketIcon from '../assets/jacket.png';

const products = [
  {
    id: 1,
    name: 'Футболка',
    category: 'Одежда',
    price: 500,
    image: tshirtIcon,
    stock: 5,
  },
  {
    id: 2,
    name: 'Наушники',
    category: 'Электроника',
    price: 1200,
    image: headphonesIcon,
    stock: 0,
  },
  {
    id: 3,
    name: 'Браслет',
    category: 'Аксессуары',
    price: 300,
    image: braceletIcon,
    stock: 3,
  },
  {
    id: 4,
    name: 'Куртка',
    category: 'Одежда',
    price: 2500,
    image: jacketIcon,
    stock: 2,
  },
];

export default products; 