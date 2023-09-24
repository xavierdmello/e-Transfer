import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  UnorderedList,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Text,
  Box,
  Image,
  Flex,
  Spacer,
} from "@chakra-ui/react";

import { useEffect, useState } from "react";
import et from "../assets/et.png";
import back from "../assets/back.png";
import settings from "../assets/settings.png";

import { ChevronLeftIcon, EditIcon } from "@chakra-ui/icons";

function Header() {
  return (
    <Box backgroundColor={"brand"} borderTopRadius={"3xl"}>
      <Flex direction={"row"} width={"100%"} verticalAlign={"true"} alignItems={"center"} pl={"20px"} pr={"20px"}>
        <ChevronLeftIcon color={"white"} boxSize={10} />
        <Spacer />
        <Image src={et} boxSize={"100px"} objectFit={"contain"} padding={"0px"} height={"80px"} />
        <Spacer />
        <EditIcon color={"white"} boxSize={7} />
      </Flex>
    </Box>
  );
}

export default Header;
