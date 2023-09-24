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
} from "@chakra-ui/react";

import { useEffect, useState } from "react";

function Header() {
  return (
    <>
      <Center>
        <Text fontSize={"xl"}  padding={"20px"} textColor={"white"} as={"b"}>
          Interac e-Transfer
        </Text>
      </Center>
    </>
  );
}

export default Header;
