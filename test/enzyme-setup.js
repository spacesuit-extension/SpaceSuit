import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

before(function () {
  configure({ adapter: new Adapter() });
})
